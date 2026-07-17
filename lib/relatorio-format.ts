// Formato interno (fonte de verdade) do relatório de conferência.
// É armazenado como texto no banco — leve, sem imagens — e o PDF bonito
// é reconstruído a partir dele na hora da impressão.

export type RelatorioItem = {
  cod: string
  descricao: string
  unidade: string
  nf: number
  conf: number
  ok: boolean
}

export type RelatorioData = {
  numero: string
  serie: string
  fornecedor: string
  cnpj: string
  emissao: string // ISO ou ""
  chave: string
  estoquista: string
  conferente: string
  gerado: string // ISO
  status: "conferida" | "divergente"
  total: number
  conferidos: number
  divergentes: number
  itens: RelatorioItem[]
}

const HEADER = "NUNEDIESEL-RELATORIO-CONFERENCIA/1"
const ITENS_MARK = "---ITENS---"

// Remove separadores usados no formato para não corromper o parse.
function clean(v: string | null | undefined): string {
  return (v ?? "").replace(/[\t\r\n]+/g, " ").trim()
}

/** Serializa os dados no formato interno de texto (armazenado no banco). */
export function serializeRelatorio(data: RelatorioData): string {
  const lines: string[] = [HEADER]
  lines.push(`numero=${clean(data.numero)}`)
  lines.push(`serie=${clean(data.serie)}`)
  lines.push(`fornecedor=${clean(data.fornecedor)}`)
  lines.push(`cnpj=${clean(data.cnpj)}`)
  lines.push(`emissao=${clean(data.emissao)}`)
  lines.push(`chave=${clean(data.chave)}`)
  lines.push(`estoquista=${clean(data.estoquista)}`)
  lines.push(`conferente=${clean(data.conferente)}`)
  lines.push(`gerado=${clean(data.gerado)}`)
  lines.push(`status=${data.status}`)
  lines.push(`total=${data.total}`)
  lines.push(`conferidos=${data.conferidos}`)
  lines.push(`divergentes=${data.divergentes}`)
  lines.push(ITENS_MARK)
  for (const it of data.itens) {
    lines.push(
      [clean(it.cod), clean(it.descricao), clean(it.unidade), it.nf, it.conf, it.ok ? 1 : 0].join("\t"),
    )
  }
  return lines.join("\n")
}

/** Faz o parse do formato interno de volta para dados estruturados. */
export function parseRelatorio(txt: string): RelatorioData {
  const raw = txt.replace(/\r/g, "").split("\n")
  const meta: Record<string, string> = {}
  const itens: RelatorioItem[] = []
  let inItens = false

  for (const line of raw) {
    if (line === HEADER) continue
    if (line === ITENS_MARK) {
      inItens = true
      continue
    }
    if (!inItens) {
      const eq = line.indexOf("=")
      if (eq > 0) meta[line.slice(0, eq)] = line.slice(eq + 1)
    } else {
      if (!line.trim()) continue
      const [cod, descricao, unidade, nf, conf, ok] = line.split("\t")
      itens.push({
        cod: cod ?? "",
        descricao: descricao ?? "",
        unidade: unidade ?? "",
        nf: Number(nf) || 0,
        conf: Number(conf) || 0,
        ok: ok === "1",
      })
    }
  }

  return {
    numero: meta.numero ?? "",
    serie: meta.serie ?? "",
    fornecedor: meta.fornecedor ?? "",
    cnpj: meta.cnpj ?? "",
    emissao: meta.emissao ?? "",
    chave: meta.chave ?? "",
    estoquista: meta.estoquista ?? "",
    conferente: meta.conferente ?? "",
    gerado: meta.gerado ?? "",
    status: meta.status === "divergente" ? "divergente" : "conferida",
    total: Number(meta.total) || itens.length,
    conferidos: Number(meta.conferidos) || 0,
    divergentes: Number(meta.divergentes) || 0,
    itens,
  }
}
