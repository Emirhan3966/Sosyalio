import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3002";
const publicRoutes = ["/", "/siparis", "/iletisim", "/gizlilik", "/kvkk", "/kullanim-sartlari", "/iptal-iade"];
const legalRoutes = ["/iletisim", "/gizlilik", "/kvkk", "/kullanim-sartlari", "/iptal-iade"];
const configuredSiteUrl = new URL(process.env.NEXT_PUBLIC_APP_URL).origin;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const route of publicRoutes) {
  const response = await fetch(new URL(route, baseUrl));
  const html = await response.text();
  assert(response.status === 200, `${route} HTTP ${response.status}`);
  assert(html.includes("<footer") && html.includes("href=\"/iletisim\"") && html.includes("href=\"/iptal-iade\""), `${route} footer veya linkleri eksik.`);
  if (legalRoutes.includes(route)) {
    assert(html.includes(`rel=\"canonical\" href=\"${configuredSiteUrl}${route}\"`), `${route} canonical yanlış.`);
  }
}

const adminResponse = await fetch(new URL("/admin/login", baseUrl));
const adminHtml = await adminResponse.text();
assert(adminResponse.status === 200 && !adminHtml.includes("<footer"), "Admin login sayfasında footer görünmemeli.");

const sitemapResponse = await fetch(new URL("/sitemap.xml", baseUrl));
const sitemapXml = await sitemapResponse.text();
assert(sitemapResponse.status === 200, `Sitemap HTTP ${sitemapResponse.status}`);
for (const route of legalRoutes) assert(sitemapXml.includes(`<loc>${configuredSiteUrl}${route}</loc>`), `Sitemap ${route} kaydını içermiyor.`);

const result = {
  routes200: publicRoutes.length,
  footerLinksValid: true,
  adminFooterHidden: true,
  canonicalsValid: true,
  sitemapValid: true,
  responsive: [],
};

if (process.env.CDP_URL) {
  const version = await fetch(`${process.env.CDP_URL}/json/version`).then((response) => response.json());
  const socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const events = [];
  socket.addEventListener("message", (message) => {
    const data = JSON.parse(message.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message)); else resolve(data.result);
    } else {
      events.push(data);
    }
  });

  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const waitForEvent = async (method, sessionId) => {
    for (let tries = 0; tries < 100; tries += 1) {
      const index = events.findIndex((event) => event.method === method && event.sessionId === sessionId);
      if (index >= 0) return events.splice(index, 1)[0];
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`${method} olayı beklenirken zaman aşımı.`);
  };

  const outputDir = path.resolve(".audit/footer-qa");
  await mkdir(outputDir, { recursive: true });
  for (const viewport of [
    { width: 390, height: 1000, route: "/iletisim", name: "iletisim-cdp-390.png" },
    { width: 768, height: 1100, route: "/kvkk", name: "kvkk-cdp-768.png" },
    { width: 1280, height: 900, route: "/gizlilik", name: "footer-cdp-1280.png", footer: true },
  ]) {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    await send("Page.enable", {}, sessionId);
    await send("Runtime.enable", {}, sessionId);
    await send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 768,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
    }, sessionId);
    await send("Page.navigate", { url: new URL(viewport.route, baseUrl).toString() }, sessionId);
    await waitForEvent("Page.loadEventFired", sessionId);
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (viewport.footer) await send("Runtime.evaluate", { expression: "document.querySelector('footer')?.scrollIntoView({block:'end'})" }, sessionId);
    const metricsResult = await send("Runtime.evaluate", {
      expression: "({innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,footerVisible:Boolean(document.querySelector('footer')),adminFooter:Boolean(location.pathname.startsWith('/admin')&&document.querySelector('footer'))})",
      returnByValue: true,
    }, sessionId);
    const metrics = metricsResult.result.value;
    assert(metrics.innerWidth === viewport.width, `${viewport.width}px viewport uygulanamadı.`);
    assert(metrics.scrollWidth <= metrics.innerWidth, `${viewport.width}px görünümde yatay taşma var (${metrics.scrollWidth}px).`);
    assert(metrics.footerVisible && !metrics.adminFooter, `${viewport.width}px görünümde footer doğrulanamadı.`);
    const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true }, sessionId);
    await writeFile(path.join(outputDir, viewport.name), Buffer.from(screenshot.data, "base64"));
    result.responsive.push({ width: viewport.width, noHorizontalOverflow: true, footerVisible: true });
    await send("Target.closeTarget", { targetId });
  }
  await send("Browser.close");
  socket.close();
}

console.log(JSON.stringify(result, null, 2));
