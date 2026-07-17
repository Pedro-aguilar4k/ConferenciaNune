"use server"

import { db } from "@/lib/db"
import { notas, itensNota, produtos, relatoriosConferencia } from "@/lib/db/schema"
import { eq, desc, and, ilike } from "drizzle-orm"
import { requirePermission } from "@/lib/guards"
import { serializeRelatorio, type RelatorioData } from "@/lib/relatorio-format"

function qty(v: string | null | undefined): number {
  return v ? Number(v) : 0
}

/**
 * Monta os dados estruturados (fonte de verdade) do relatório de conferência.
 * O conteúdo é serializado como texto leve; o PDF bonito é reconstruído a
 * partir dele na hora da impressão.
 */
function buildRelatorioData(params: {
  nota: typeof notas.$inferSelect
  itens: { item: typeof itensNota.$inferSelect; produtoCodigo: string | null; produtoDescricao: string | null }[]
  estoquista: string
  conferentePor: string
  geradoEm: Date
}): RelatorioData {
  const { nota, itens, estoquista, conferentePor, geradoEm } = params

  let conferidos = 0
  let divergentes = 0
  const linhasItens = itens.map(({ item, produtoCodigo, produtoDescricao }) => {
    const q = qty(item.quantidade)
    const qc = qty(item.quantidadeConferida)
    const ok = qc >= q && q > 0
    if (ok) conferidos++
    else divergentes++
    return {
      cod: produtoCodigo ?? item.codigoFornecedor ?? "-",
      descricao: produtoDescricao ?? item.descricaoFornecedor ?? "-",
      unidade: item.unidade ?? "",
      nf: q,
      conf: qc,
      ok,
    }
  })

  return {
    numero: nota.numero ?? "",
    serie: nota.serie ?? "",
    fornecedor: nota.fornecedorNome ?? "",
    cnpj: nota.fornecedorCnpj ?? "",
    emissao: nota.dataEmissao ? new Date(nota.dataEmissao).toISOString() : "",
    chave: nota.chaveAcesso ?? "",
    estoquista,
    conferente: conferentePor,
    gerado: geradoEm.toISOString(),
    status: divergentes === 0 ? "conferida" : "divergente",
    total: itens.length,
    conferidos,
    divergentes,
    itens: linhasItens,
  }
}

export type RelatorioResumo = {
  id: number
  notaId: number
  numeroNota: string | null
  fornecedorNome: string | null
  estoquista: string
  status: string
  totalItens: number
  itensConferidos: number
  itensDivergentes: number
  createdByNome: string | null
  createdAt: Date
}

/** Gera e salva o relatório de conferência (TXT) para a nota. */
export async function gerarRelatorioConferencia(input: {
  notaId: number
  estoquista: string
}): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const actor = await requirePermission("conferir")
  const nome = input.estoquista.trim()
  if (!nome) return { ok: false, error: "Informe o nome do estoquista." }

  const [nota] = await db.select().from(notas).where(eq(notas.id, input.notaId)).limit(1)
  if (!nota) return { ok: false, error: "Nota não encontrada." }

  const itens = await db
    .select({
      item: itensNota,
      produtoCodigo: produtos.codigoInterno,
      produtoDescricao: produtos.descricao,
    })
    .from(itensNota)
    .leftJoin(produtos, eq(produtos.id, itensNota.produtoId))
    .where(eq(itensNota.notaId, input.notaId))
    .orderBy(itensNota.id)

  const geradoEm = new Date()
  const data = buildRelatorioData({
    nota,
    itens,
    estoquista: nome,
    conferentePor: actor.name,
    geradoEm,
  })

  const [row] = await db
    .insert(relatoriosConferencia)
    .values({
      notaId: nota.id,
      numeroNota: nota.numero,
      fornecedorNome: nota.fornecedorNome,
      estoquista: nome,
      status: data.status,
      totalItens: data.total,
      itensConferidos: data.conferidos,
      itensDivergentes: data.divergentes,
      conteudoTxt: serializeRelatorio(data),
      createdBy: actor.id,
      createdByNome: actor.name,
      createdAt: geradoEm,
    })
    .returning({ id: relatoriosConferencia.id })

  return { ok: true, id: row.id }
}

/** Lista todos os relatórios gerados, com filtro opcional por número da nota. */
export async function listTodosRelatorios(input?: { numero?: string }): Promise<RelatorioResumo[]> {
  await requirePermission("relatorios")
  const conds = []
  if (input?.numero?.trim()) conds.push(ilike(relatoriosConferencia.numeroNota, `%${input.numero.trim()}%`))
  const rows = await db
    .select({
      id: relatoriosConferencia.id,
      notaId: relatoriosConferencia.notaId,
      numeroNota: relatoriosConferencia.numeroNota,
      fornecedorNome: relatoriosConferencia.fornecedorNome,
      estoquista: relatoriosConferencia.estoquista,
      status: relatoriosConferencia.status,
      totalItens: relatoriosConferencia.totalItens,
      itensConferidos: relatoriosConferencia.itensConferidos,
      itensDivergentes: relatoriosConferencia.itensDivergentes,
      createdByNome: relatoriosConferencia.createdByNome,
      createdAt: relatoriosConferencia.createdAt,
    })
    .from(relatoriosConferencia)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(relatoriosConferencia.createdAt))
    .limit(200)
  return rows
}

/** Lista os relatórios já gerados para uma nota. */
export async function listRelatoriosNota(notaId: number): Promise<RelatorioResumo[]> {
  await requirePermission("conferir")
  const rows = await db
    .select({
      id: relatoriosConferencia.id,
      notaId: relatoriosConferencia.notaId,
      numeroNota: relatoriosConferencia.numeroNota,
      fornecedorNome: relatoriosConferencia.fornecedorNome,
      estoquista: relatoriosConferencia.estoquista,
      status: relatoriosConferencia.status,
      totalItens: relatoriosConferencia.totalItens,
      itensConferidos: relatoriosConferencia.itensConferidos,
      itensDivergentes: relatoriosConferencia.itensDivergentes,
      createdByNome: relatoriosConferencia.createdByNome,
      createdAt: relatoriosConferencia.createdAt,
    })
    .from(relatoriosConferencia)
    .where(eq(relatoriosConferencia.notaId, notaId))
    .orderBy(desc(relatoriosConferencia.createdAt))
  return rows
}
