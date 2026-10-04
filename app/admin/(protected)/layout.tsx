import type { Metadata } from "next";
import { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
