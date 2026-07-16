import { requireUser } from "@/lib/session"
import { ROLE_LABELS, type Role } from "@/lib/permissions"

export default async function DashboardPage() {
  const user = await requireUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bem-vindo, {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Você está conectado como {ROLE_LABELS[user.role as Role]}.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        O painel com indicadores será construído em seguida.
      </div>
    </div>
  )
}
