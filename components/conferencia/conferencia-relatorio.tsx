"use client"

import useSWR from "swr"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, AlertTriangle, FileText, Printer, ClipboardList } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ItemStatusBadge } from "@/components/status-badge"
import { listRelatoriosNota } from "@/app/actions/relatorio-conferencia"
import { abrirRelatorioPdf } from "@/lib/relatorio-download"

type ItemPayload = {
  id: number
  produtoCodigo: string | null
  produtoDescricao: string | null
  descricaoNfe: string | null
  quantidade: number
  quantidadeConferida: number
  unidade: string | null
  statusConferencia: string
}

type Props = {
  nota: { id: number; numero: string | null; fornecedorNome: string | null }
  itens: ItemPayload[]
  status: "conferida" | "divergente"
}

function isOk(i: ItemPayload) {
  return i.quantidadeConferida >= i.quantidade && i.quantidade > 0
}

export function ConferenciaRelatorio({ nota, itens, status }: Props) {
  const { data: relatorios } = useSWR(["relatorios-nota", nota.id], () => listRelatoriosNota(nota.id))

  const totalItens = itens.length
  const conferidos = itens.filter(isOk).length
  const divergentes = totalItens - conferidos

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button asChild variant="ghost" size="sm" className="w-fit -ml-2 text-muted-foreground">
          <Link href="/conferencia">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Voltar para conferência
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground text-balance">
          {nota.numero ? `Conferência concluída · Nota Nº ${nota.numero}` : `Conferência concluída · Nota #${nota.id}`}
        </h1>
        <p className="text-sm text-muted-foreground">{nota.fornecedorNome ?? "Sem fornecedor"}</p>
      </div>

      {/* Status geral */}
      <Card
        className={`flex items-center gap-4 p-5 ${
          status === "conferida"
            ? "border-success/30 bg-success/5"
            : "border-warning/40 bg-warning/5"
        }`}
      >
        {status === "conferida" ? (
          <CheckCircle2 className="h-10 w-10 shrink-0 text-success" />
        ) : (
          <AlertTriangle className="h-10 w-10 shrink-0 text-warning" />
        )}
        <div>
          <p className="text-lg font-bold text-foreground">
            {status === "conferida" ? "Conferência sem divergências" : "Conferência com divergências"}
          </p>
          <p className="text-sm text-muted-foreground">
            {conferidos} de {totalItens} itens conferidos corretamente
            {divergentes > 0 ? ` · ${divergentes} divergente(s)` : ""}
          </p>
        </div>
      </Card>

      {/* Resumo dos itens */}
      <Card className="flex flex-col gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Itens conferidos</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">NF</TableHead>
                <TableHead className="text-right">Conferido</TableHead>
                <TableHead className="text-right">Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {i.produtoDescricao ?? i.descricaoNfe ?? "-"}
                    </div>
                    {i.produtoCodigo && (
                      <div className="text-xs text-muted-foreground">Cód. {i.produtoCodigo}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {i.quantidade} {i.unidade ?? ""}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {i.quantidadeConferida} {i.unidade ?? ""}
                  </TableCell>
                  <TableCell className="text-right">
                    <ItemStatusBadge status={isOk(i) ? "conferido" : "divergente"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Relatórios gerados */}
      {relatorios && relatorios.length > 0 && (
        <Card className="flex flex-col gap-0 overflow-hidden p-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Relatórios gerados</h2>
          </div>
          <ul className="divide-y divide-border">
            {relatorios.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">Estoquista: {r.estoquista}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString("pt-BR")} · {r.itensConferidos}/{r.totalItens} OK
                    {r.itensDivergentes > 0 ? ` · ${r.itensDivergentes} diverg.` : ""}
                    {r.createdByNome ? ` · por ${r.createdByNome}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" onClick={() => abrirRelatorioPdf(r.id)}>
                    <Printer className="mr-1.5 h-4 w-4" />
                    Imprimir PDF
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
