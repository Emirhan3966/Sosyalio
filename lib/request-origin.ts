function normalizeHost(value: string | null) {
  const candidate = value?.split(",", 1)[0]?.trim();
  if (!candidate) return null;

  try {
    return new URL(`http://${candidate}`).host.toLowerCase();
  } catch {
    return null;
  }
}

export function isRequestSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host.toLowerCase();
    const requestHosts = new Set([
      new URL(request.url).host.toLowerCase(),
      normalizeHost(request.headers.get("host")),
      normalizeHost(request.headers.get("x-forwarded-host")),
    ].filter((host): host is string => Boolean(host)));

    return requestHosts.has(originHost);
  } catch {
    return false;
  }
}
