export type SupportApiPayload = {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
};

export async function safeSupportJson<T extends SupportApiPayload>(response: Response, fallbackMessage: string): Promise<T> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const body = await response.text();

  if (!body.trim() || !contentType.includes("application/json")) {
    throw new Error(fallbackMessage);
  }

  let data: T;
  try {
    data = JSON.parse(body) as T;
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!response.ok || data.ok === false) {
    throw new Error(typeof data.error === "string" && data.error ? data.error : fallbackMessage);
  }

  return data;
}
