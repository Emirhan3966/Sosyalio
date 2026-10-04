import type { PaymentStatus } from "@prisma/client";

const labels: Record<PaymentStatus, string> = { UNPAID: "Ödenmedi", PENDING: "Ödeme Bekleniyor", PAID: "Ödendi", FAILED: "Başarısız", REFUNDED: "İade" };
const styles: Record<PaymentStatus, string> = { UNPAID: "bg-slate-100 text-slate-600", PENDING: "bg-amber-50 text-amber-700", PAID: "bg-emerald-50 text-emerald-700", FAILED: "bg-red-50 text-red-700", REFUNDED: "bg-purple-50 text-purple-700" };

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold ${styles[status]}`}>{labels[status]}</span>;
}
