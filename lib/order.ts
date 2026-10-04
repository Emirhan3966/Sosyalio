import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";

export const orderStatusLabels = {
  PENDING: "Bekliyor",
  PROCESSING: "İşleniyor",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal edildi",
} as const;

export function formatPrice(value: number | string) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(value));
}

export async function createUniqueOrderNumber() {
  const date = new Date().toISOString().slice(2, 10).replaceAll("-", "");

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    const orderNumber = `SYL-${date}-${suffix}`;
    const exists = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true } });
    if (!exists) return orderNumber;
  }

  throw new Error("Benzersiz sipariş numarası oluşturulamadı.");
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}
