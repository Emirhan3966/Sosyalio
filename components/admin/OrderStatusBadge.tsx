import type { OrderStatus } from "@prisma/client";

const labels: Record<OrderStatus, string> = { PENDING: "Bekliyor", PROCESSING: "İşleniyor", COMPLETED: "Tamamlandı", CANCELLED: "İptal" };
const styles: Record<OrderStatus, string> = { PENDING: "bg-amber-50 text-amber-700", PROCESSING: "bg-blue-50 text-blue-700", COMPLETED: "bg-emerald-50 text-emerald-700", CANCELLED: "bg-red-50 text-red-700" };

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold ${styles[status]}`}>{labels[status]}</span>;
}
