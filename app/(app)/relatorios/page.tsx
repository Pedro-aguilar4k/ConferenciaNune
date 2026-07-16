import { requireUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { roleHasPermission } from "@/lib/permissions"
import { PageHeader } from "@/components/page-header"
import { ComingSoon } from "@/components/coming-soon"

export default async function RelatoriosPage() {
  const user = await requireUser()
  if (!roleHasPermission(user.role, "relatorios")) redirect("/")
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" description="Relatórios de conferência e divergências." />
      <ComingSoon title="Relatórios" />
    </div>
  )
}
