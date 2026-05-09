import { redirect } from "next/navigation";

import { CustomerDashboardHub } from "@/components/dashboard/customer-dashboard-hub";
import { getRoleHomePath } from "@/lib/auth/role-contracts";
import { getServerSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const { user, identity } = await getServerSession();

  if (!user) {
    return null;
  }

  if (identity && identity.role !== "customer") {
    redirect(getRoleHomePath(identity.role));
  }

  return <CustomerDashboardHub user={user} />;
}
