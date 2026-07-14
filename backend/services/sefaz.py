"""Integração com o SEFAZ — Distribuição de DF-e (NFeDistribuicaoDFe).

Este serviço consulta o webservice nacional de Distribuição de Documentos
Fiscais Eletrônicos, que devolve as NF-e emitidas CONTRA um CNPJ (onde o
CNPJ é o destinatário). É o único caminho oficial para obter o XML completo
de notas de terceiros, e exige autenticação via certificado digital A1
(mTLS — TLS mútuo).

Referência: Manual de Distribuição de DF-e / schema distDFeInt v1.35.
"""

import base64
import gzip
import io
import re
import tempfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass

from requests_pkcs12 import post as pkcs12_post
from cryptography.hazmat.primitives.serialization import pkcs12 as crypto_pkcs12

# ── Endpoints ──────────────────────────────────────────────────────
# A Distribuição DF-e é um serviço nacional (Ambiente Nacional - AN).
DISTRIBUICAO_URLS = {
    # tpAmb = 1 (produção)
    "producao": "https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx",
    # tpAmb = 2 (homologação)
    "homologacao": "https://hom.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx",
}

SOAP_ACTION = "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse"
NFE_NS = "http://www.portalfiscal.inf.br/nfe"

# Código de UF do Ambiente Nacional usado no cUFAutor para distribuição
CUF_AMBIENTE_NACIONAL = "91"


@dataclass
class CertInfo:
    """Metadados extraídos de um certificado A1 (.pfx/.p12)."""

    subject: str
    cnpj: str | None
    not_before: str
    not_after: str


class SefazError(Exception):
    """Erro de comunicação ou de negócio com o SEFAZ."""


def validar_certificado(pfx_bytes: bytes, senha: str) -> CertInfo:
    """Abre o A1 e retorna metadados. Levanta SefazError se a senha estiver errada."""
    try:
        _key, cert, _add = crypto_pkcs12.load_key_and_certificates(
            pfx_bytes, senha.encode("utf-8")
        )
    except Exception as e:  # senha incorreta ou arquivo inválido
        raise SefazError(f"Não foi possível abrir o certificado: verifique a senha. ({e})")

    if cert is None:
        raise SefazError("Certificado inválido: nenhum certificado encontrado no arquivo.")

    subject = cert.subject.rfc4514_string()
    # O CNPJ costuma aparecer no CN como 'NOME:CNPJ'
    cnpj_match = re.search(r"(\d{14})", subject)
    cnpj = cnpj_match.group(1) if cnpj_match else None

    return CertInfo(
        subject=subject,
        cnpj=cnpj,
        not_before=cert.not_valid_before_utc.isoformat(),
        not_after=cert.not_valid_after_utc.isoformat(),
    )


def _build_soap_envelope(cnpj: str, ultimo_nsu: str, tp_amb: str) -> str:
    """Monta o envelope SOAP para consulta por distNSU (lote sequencial)."""
    nsu = str(ultimo_nsu).zfill(15)
    dist_dfe = (
        f'<distDFeInt xmlns="{NFE_NS}" versao="1.35">'
        f"<tpAmb>{tp_amb}</tpAmb>"
        f"<cUFAutor>{CUF_AMBIENTE_NACIONAL}</cUFAutor>"
        f"<CNPJ>{cnpj}</CNPJ>"
        f"<distNSU><ultNSU>{nsu}</ultNSU></distNSU>"
        f"</distDFeInt>"
    )
    envelope = (
        '<?xml version="1.0" encoding="utf-8"?>'
        '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">'
        "<soap12:Body>"
        '<nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">'
        f"<nfeDadosMsg>{dist_dfe}</nfeDadosMsg>"
        "</nfeDistDFeInteresse>"
        "</soap12:Body>"
        "</soap12:Envelope>"
    )
    return envelope


def _strip_ns(xml_str: str) -> ET.Element:
    """Remove namespaces para simplificar o parse da resposta."""
    clean = re.sub(r'\sxmlns(:\w+)?="[^"]*"', "", xml_str)
    clean = re.sub(r"<(/?)\w+:", r"<\1", clean)
    return ET.fromstring(clean)


def _decompress_docs(root: ET.Element) -> list[str]:
    """Extrai e descompacta (gzip+base64) cada docZip da resposta."""
    xmls: list[str] = []
    for doc in root.iter("docZip"):
        if not doc.text:
            continue
        try:
            raw = gzip.GzipFile(fileobj=io.BytesIO(base64.b64decode(doc.text))).read()
            xmls.append(raw.decode("utf-8", errors="replace"))
        except Exception:
            continue
    return xmls


def consultar_distribuicao(
    pfx_bytes: bytes,
    senha: str,
    cnpj: str,
    ultimo_nsu: str = "0",
    ambiente: str = "homologacao",
) -> dict:
    """Consulta um lote de documentos a partir do último NSU processado.

    Retorna dict com: cStat, xMotivo, ultNSU, maxNSU, e a lista de XMLs
    (docs) já descompactados. Cada chamada devolve até ~50 documentos ou 1 MB.
    """
    tp_amb = "1" if ambiente == "producao" else "2"
    url = DISTRIBUICAO_URLS.get(ambiente, DISTRIBUICAO_URLS["homologacao"])
    envelope = _build_soap_envelope(cnpj, ultimo_nsu, tp_amb)

    # requests_pkcs12 aceita os bytes do .pfx diretamente via pkcs12_data
    try:
        resp = pkcs12_post(
            url,
            data=envelope.encode("utf-8"),
            headers={"Content-Type": "application/soap+xml; charset=utf-8"},
            pkcs12_data=pfx_bytes,
            pkcs12_password=senha,
            timeout=60,
        )
    except Exception as e:
        raise SefazError(f"Falha na conexão TLS com o SEFAZ: {e}")

    if resp.status_code != 200:
        raise SefazError(
            f"SEFAZ respondeu HTTP {resp.status_code}. "
            f"Verifique o certificado e o ambiente ({ambiente})."
        )

    try:
        root = _strip_ns(resp.text)
    except Exception as e:
        raise SefazError(f"Resposta do SEFAZ ilegível: {e}")

    def _find_text(tag: str) -> str | None:
        el = root.find(f".//{tag}")
        return el.text if el is not None else None

    c_stat = _find_text("cStat")
    x_motivo = _find_text("xMotivo")
    ult_nsu = _find_text("ultNSU") or ultimo_nsu
    max_nsu = _find_text("maxNSU") or ult_nsu

    docs = _decompress_docs(root)

    return {
        "cStat": c_stat,
        "xMotivo": x_motivo,
        "ultNSU": ult_nsu,
        "maxNSU": max_nsu,
        "docs": docs,
    }


def extrair_nfe_procs(xmls: list[str]) -> list[str]:
    """Filtra apenas os documentos que são NF-e completas (nfeProc/NFe).

    A distribuição também devolve resumos (resNFe), eventos (resEvento/procEvento)
    etc. Só as notas completas têm os itens para conferência.
    """
    completas: list[str] = []
    for xml in xmls:
        if "<infNFe" in xml and ("<det" in xml):
            completas.append(xml)
    return completas
