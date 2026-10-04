import { confirmMockPayment, getShopierMode } from "@/lib/payments/shopier";
import { isSameOrigin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  if (getShopierMode() !== "mock" || process.env.NODE_ENV === "production") return Response.json({ error: "Mock ödeme bu ortamda devre dışı." }, { status: 404 });
  let body: { orderNumber?: unknown; token?: unknown };
  try { body = await request.json() as typeof body; } catch { return Response.json({ error: "Geçersiz istek." }, { status: 400 }); }
  const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim().toUpperCase() : "";
  const token = typeof body.token === "string" ? body.token : "";
  if (!/^SYL-\d{6}-[A-F0-9]{6}$/.test(orderNumber) || token.length < 32 || token.length > 200) return Response.json({ error: "Geçersiz mock ödeme isteği." }, { status: 400 });
  try {
    const result = await confirmMockPayment(orderNumber, token);
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ success: true });
  } catch {
    console.error("Mock ödeme doğrulama işlemi başarısız oldu.");
    return Response.json({ ok: false, error: "Mock ödeme tamamlanamadı." }, { status: 400 });
  }
}
