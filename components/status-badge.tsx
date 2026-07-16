import { Badge } from "@/components/ui/badge"

export function AtivoBadge({ ativo }: { ativo: boolean }) {
  if (ativo) {
    return (
      <Badge className="border border-success/30 bg-success/15 text-success hover:bg-success/15">
        Ativo
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      Inativo
    </Badge>
  )
}
