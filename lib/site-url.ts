export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) throw new Error("NEXT_PUBLIC_APP_URL tanımlı değil.");
  return new URL(value).origin;
}
