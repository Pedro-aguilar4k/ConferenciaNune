import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont, type PDFImage } from "pdf-lib"
import { db } from "@/lib/db"
import { relatoriosConferencia } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAnyPermission } from "@/lib/guards"
import { parseRelatorio, type RelatorioData } from "@/lib/relatorio-format"

// Paleta NuneDiesel — azul e branco
const NAVY = rgb(0.086, 0.102, 0.384)
const BLUE = rgb(0.161, 0.322, 0.706)
const BLUE_SOFT = rgb(0.62, 0.71, 0.93)
const WHITE = rgb(1, 1, 1)
const INK = rgb(0.1, 0.12, 0.17)
const MUTED = rgb(0.42, 0.45, 0.52)
const LIGHT = rgb(0.957, 0.969, 0.988)
const ZEBRA = rgb(0.97, 0.976, 0.99)
const BORDER = rgb(0.83, 0.86, 0.92)
const GREEN = rgb(0.13, 0.55, 0.34)
const GREEN_BG = rgb(0.9, 0.96, 0.92)
const RED = rgb(0.75, 0.26, 0.26)
const RED_BG = rgb(0.98, 0.92, 0.92)

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 48
const CONTENT_W = PAGE_W - MARGIN * 2

// Mantém apenas caracteres suportados pela codificação WinAnsi.
function enc(s: string | null | undefined): string {
  return (s ?? "").replace(/[^\x00-\xff]/g, "?").replace(/[\x81\x8d\x8f\x90\x9d]/g, "?")
}

function fmtDate(iso: string, withTime = false): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  const p = (n: number) => String(n).padStart(2, "0")
  const base = `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
  return withTime ? `${base} ${p(d.getHours())}:${p(d.getMinutes())}` : base
}

function truncate(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text
  let t = text
  while (t.length > 1 && font.widthOfTextAtSize(t + "...", size) > maxWidth) t = t.slice(0, -1)
  return t + "..."
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAnyPermission("conferir", "relatorios")
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params
  const relId = Number(id)
  if (!Number.isFinite(relId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const [rel] = await db
    .select()
    .from(relatoriosConferencia)
    .where(eq(relatoriosConferencia.id, relId))
    .limit(1)
  if (!rel) return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 })

  const data = parseRelatorio(rel.conteudoTxt)

  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  // Logo da loja (PNG com fundo transparente) — embutida no cabeçalho.
  let logo: PDFImage | null = null
  try {
    const logoBytes = await readFile(path.join(process.cwd(), "public", "nune-logo.png"))
    logo = await pdf.embedPng(logoBytes)
  } catch {
    logo = null
  }
  const logoRatio = logo ? logo.width / logo.height : 1.5

  const generatedLabel = fmtDate(data.gerado, true)

  // ---- Estado de paginação ----
  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H

  const text = (
    s: string,
    x: number,
    yy: number,
    opts: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb> } = {},
  ) => {
    page.drawText(enc(s), { x, y: yy, size: opts.size ?? 10, font: opts.f ?? font, color: opts.color ?? INK })
  }

  const drawHeader = () => {
    const bandH = 104
    // Faixa azul-marinho
    page.drawRectangle({ x: 0, y: PAGE_H - bandH, width: PAGE_W, height: bandH, color: NAVY })
    // Detalhe azul (linha inferior)
    page.drawRectangle({ x: 0, y: PAGE_H - bandH - 4, width: PAGE_W, height: 4, color: BLUE })

    // Bloco branco com a logo (fundo transparente da logo aparece sobre o branco)
    const tileW = 72
    const tileH = 56
    const tileX = MARGIN
    const tileTop = PAGE_H - 24
    let brandX = MARGIN
    if (logo) {
      page.drawRectangle({ x: tileX, y: tileTop - tileH, width: tileW, height: tileH, color: WHITE })
      const lw = 54
      const lh = lw / logoRatio
      page.drawImage(logo, {
        x: tileX + (tileW - lw) / 2,
        y: tileTop - tileH + (tileH - lh) / 2,
        width: lw,
        height: lh,
      })
      brandX = tileX + tileW + 16
    }

    text("NUNEDIESEL", brandX, PAGE_H - 44, { size: 21, f: bold, color: WHITE })
    text("AUTOPECAS  .  LINHA PESADA", brandX, PAGE_H - 60, { size: 8, f: bold, color: BLUE_SOFT })

    // Título à direita
    const t1 = "RELATORIO DE CONFERENCIA"
    const t1w = bold.widthOfTextAtSize(t1, 12)
    text(t1, PAGE_W - MARGIN - t1w, PAGE_H - 44, { size: 12, f: bold, color: WHITE })
    const t2 = "Documento de recebimento de mercadoria"
    const t2w = font.widthOfTextAtSize(t2, 8)
    text(t2, PAGE_W - MARGIN - t2w, PAGE_H - 60, { size: 8, color: BLUE_SOFT })
    y = PAGE_H - bandH - 26
  }

  const drawFooter = (pageNum: number) => {
    const fy = 32
    page.drawLine({
      start: { x: MARGIN, y: fy + 12 },
      end: { x: PAGE_W - MARGIN, y: fy + 12 },
      thickness: 0.5,
      color: BORDER,
    })
    text("NuneDiesel  .  Relatorio de conferencia", MARGIN, fy, { size: 7.5, color: MUTED })
    const rightTxt = `Gerado em ${generatedLabel}   .   Pagina ${pageNum}`
    const rw = font.widthOfTextAtSize(rightTxt, 7.5)
    text(rightTxt, PAGE_W - MARGIN - rw, fy, { size: 7.5, color: MUTED })
  }

  let pageNum = 1
  drawHeader()

  const newPage = () => {
    drawFooter(pageNum)
    page = pdf.addPage([PAGE_W, PAGE_H])
    pageNum++
    drawHeader()
  }

  const ensure = (needed: number) => {
    if (y - needed < 60) newPage()
  }

  // ---- Cartão de metadados ----
  const cardH = 148
  ensure(cardH)
  const cardTop = y
  page.drawRectangle({
    x: MARGIN,
    y: cardTop - cardH,
    width: CONTENT_W,
    height: cardH,
    color: LIGHT,
    borderColor: BORDER,
    borderWidth: 1,
  })

  // Badge de status (canto superior direito do cartão)
  const conferida = data.status === "conferida"
  const badge = conferida ? "CONFERIDA" : "DIVERGENTE"
  const badgeColor = conferida ? GREEN : RED
  const badgeBg = conferida ? GREEN_BG : RED_BG
  const badgeW = bold.widthOfTextAtSize(badge, 9) + 22
  page.drawRectangle({
    x: MARGIN + CONTENT_W - badgeW - 16,
    y: cardTop - 34,
    width: badgeW,
    height: 20,
    color: badgeBg,
    borderColor: badgeColor,
    borderWidth: 1,
  })
  text(badge, MARGIN + CONTENT_W - badgeW - 16 + 11, cardTop - 28, { size: 9, f: bold, color: badgeColor })

  const field = (label: string, value: string, x: number, yy: number, maxW: number) => {
    text(label.toUpperCase(), x, yy, { size: 7, f: bold, color: MUTED })
    text(truncate(value || "-", font, 10.5, maxW), x, yy - 14, { size: 10.5, color: INK })
  }

  const colL = MARGIN + 16
  const colR = MARGIN + CONTENT_W / 2 + 8
  const colW = CONTENT_W / 2 - 24
  let ry = cardTop - 50

  const notaLabel = data.serie ? `${data.numero || "-"}  (Serie ${data.serie})` : data.numero || "-"
  field("Nota Fiscal", notaLabel, colL, ry, colW - badgeW)
  field("Emissao", fmtDate(data.emissao), colR, ry, colW)
  ry -= 40
  field("Fornecedor", data.fornecedor, colL, ry, colW)
  field("CNPJ", data.cnpj, colR, ry, colW)
  ry -= 40
  field("Estoquista", data.estoquista, colL, ry, colW)
  field("Conferido por", data.conferente, colR, ry, colW)

  y = cardTop - cardH - 12
  // Chave de acesso (linha completa, discreta)
  if (data.chave) {
    text("CHAVE DE ACESSO", MARGIN, y, { size: 7, f: bold, color: MUTED })
    text(truncate(data.chave, font, 9, CONTENT_W), MARGIN + 96, y, { size: 9, color: MUTED })
    y -= 22
  } else {
    y -= 4
  }

  // ---- Título da tabela ----
  ensure(40)
  text("ITENS CONFERIDOS", MARGIN, y, { size: 11, f: bold, color: NAVY })
  y -= 16

  // ---- Cabeçalho da tabela ----
  const cols = {
    cod: MARGIN + 8,
    desc: MARGIN + 78,
    un: MARGIN + 330,
    nf: MARGIN + 408, // right edge
    conf: MARGIN + 462, // right edge
    sit: MARGIN + CONTENT_W - 8, // right edge
  }
  const drawTableHead = () => {
    page.drawRectangle({ x: MARGIN, y: y - 22, width: CONTENT_W, height: 22, color: NAVY })
    const hy = y - 15
    text("COD", cols.cod, hy, { size: 8, f: bold, color: WHITE })
    text("DESCRICAO", cols.desc, hy, { size: 8, f: bold, color: WHITE })
    text("UN", cols.un, hy, { size: 8, f: bold, color: WHITE })
    const nfw = bold.widthOfTextAtSize("NF", 8)
    text("NF", cols.nf - nfw, hy, { size: 8, f: bold, color: WHITE })
    const cfw = bold.widthOfTextAtSize("CONF", 8)
    text("CONF", cols.conf - cfw, hy, { size: 8, f: bold, color: WHITE })
    const stw = bold.widthOfTextAtSize("SIT", 8)
    text("SIT", cols.sit - stw, hy, { size: 8, f: bold, color: WHITE })
    y -= 22
  }
  drawTableHead()

  // ---- Linhas ----
  const rowH = 20
  data.itens.forEach((it, idx) => {
    if (y - rowH < 60) {
      newPage()
      y -= 4
      drawTableHead()
    }
    const rowTop = y
    if (!it.ok) {
      page.drawRectangle({ x: MARGIN, y: rowTop - rowH, width: CONTENT_W, height: rowH, color: RED_BG })
    } else if (idx % 2 === 1) {
      page.drawRectangle({ x: MARGIN, y: rowTop - rowH, width: CONTENT_W, height: rowH, color: ZEBRA })
    }
    const ty = rowTop - 13.5
    text(truncate(it.cod, font, 8.5, 64), cols.cod, ty, { size: 8.5, color: INK })
    text(truncate(it.descricao, font, 9, cols.un - cols.desc - 6), cols.desc, ty, { size: 9, color: INK })
    text(truncate(it.unidade || "-", font, 8.5, 40), cols.un, ty, { size: 8.5, color: MUTED })
    const nfStr = String(it.nf)
    text(nfStr, cols.nf - font.widthOfTextAtSize(nfStr, 9), ty, { size: 9, color: INK })
    const cfStr = String(it.conf)
    text(cfStr, cols.conf - font.widthOfTextAtSize(cfStr, 9), ty, { size: 9, f: bold, color: it.ok ? INK : RED })
    const sit = it.ok ? "OK" : "DIVERG."
    const sitColor = it.ok ? GREEN : RED
    text(sit, cols.sit - bold.widthOfTextAtSize(sit, 8), ty, { size: 8, f: bold, color: sitColor })
    // Linha separadora sutil
    page.drawLine({
      start: { x: MARGIN, y: rowTop - rowH },
      end: { x: PAGE_W - MARGIN, y: rowTop - rowH },
      thickness: 0.4,
      color: BORDER,
    })
    y -= rowH
  })

  // ---- Resumo (3 caixas) ----
  y -= 20
  ensure(70)
  const boxGap = 12
  const boxW = (CONTENT_W - boxGap * 2) / 3
  const boxH = 52
  const boxTop = y
  const boxes = [
    { label: "TOTAL DE ITENS", value: String(data.total), color: NAVY },
    { label: "CONFERIDOS OK", value: String(data.conferidos), color: GREEN },
    { label: "DIVERGENTES", value: String(data.divergentes), color: data.divergentes > 0 ? RED : MUTED },
  ]
  boxes.forEach((b, i) => {
    const bx = MARGIN + i * (boxW + boxGap)
    page.drawRectangle({
      x: bx,
      y: boxTop - boxH,
      width: boxW,
      height: boxH,
      color: LIGHT,
      borderColor: BORDER,
      borderWidth: 1,
    })
    page.drawRectangle({ x: bx, y: boxTop - boxH, width: 4, height: boxH, color: b.color })
    text(b.label, bx + 14, boxTop - 20, { size: 7.5, f: bold, color: MUTED })
    text(b.value, bx + 14, boxTop - 42, { size: 20, f: bold, color: b.color })
  })
  y = boxTop - boxH - 40

  // ---- Assinaturas ----
  ensure(60)
  const sigW = (CONTENT_W - 40) / 2
  const sigY = y
  const sig = (label: string, sub: string, x: number) => {
    page.drawLine({ start: { x, y: sigY }, end: { x: x + sigW, y: sigY }, thickness: 0.8, color: INK })
    text(label, x, sigY - 14, { size: 9, f: bold, color: INK })
    text(sub, x, sigY - 26, { size: 7.5, color: MUTED })
  }
  sig("Estoquista", data.estoquista || "______________________", MARGIN)
  sig("Conferente", data.conferente || "______________________", MARGIN + sigW + 40)

  drawFooter(pageNum)

  const bytes = await pdf.save()
  const nome = `relatorio-conferencia-nota-${data.numero || rel.notaId}-${rel.id}.pdf`

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nome}"`,
      "Cache-Control": "no-store",
    },
  })
}
