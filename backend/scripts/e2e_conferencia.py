"""Teste end-to-end do novo fluxo de conferencia (roda contra o backend em localhost:8001)."""
import sys, uuid, json
import requests

BASE = "http://localhost:8001/api"
XML = __file__.rsplit("/", 1)[0] + "/nfe_teste.xml"

def check(cond, msg):
    print(("  OK  " if cond else " FAIL ") + msg)
    if not cond:
        sys.exit(1)

s = requests.Session()

# 1) Login
r = s.post(f"{BASE}/auth/login", json={"username": "admin", "password": "admin"})
check(r.status_code == 200, f"login ({r.status_code})")
s.headers["Authorization"] = f"Bearer {r.json()['token']}"

# limpa produtos de teste anteriores (idempotencia do proprio teste)
# 2) Cria produtos: P001/P002 casam por EAN; P003 tem descricao distinta (nao casa) e sem EAN
prods = [
    {"codigo": "P001", "descricao": "FILTRO DE OLEO MOTOR", "ean": "7890000000017", "unidade": "UN", "preco": 25},
    {"codigo": "P002", "descricao": "CORREIA DENTADA REFORCADA", "ean": "7890000000024", "unidade": "UN", "preco": 120},
    {"codigo": "P003", "descricao": "ZZZ PECA SEM CORRESPONDENCIA OBVIA", "ean": "", "unidade": "UN", "preco": 45},
]
ids = {}
for p in prods:
    r = s.post(f"{BASE}/produtos", json=p)
    if r.status_code == 400:  # ja existe
        lst = s.get(f"{BASE}/produtos", params={"search": p["codigo"]}).json()
        ids[p["codigo"]] = next(x["id"] for x in lst if x["codigo"] == p["codigo"])
    else:
        check(r.status_code == 200, f"cria produto {p['codigo']} ({r.status_code})")
        ids[p["codigo"]] = r.json()["id"]

# 2b) Limpa nota de teste anterior (mesma chave) para permitir re-runs
for n in s.get(f"{BASE}/notas").json():
    if n.get("numero") == "12345":
        s.delete(f"{BASE}/notas/{n['id']}")

# 3) Importa XML
with open(XML, "rb") as f:
    r = s.post(f"{BASE}/notas/importar-xml", files={"file": ("nfe_teste.xml", f, "text/xml")})
check(r.status_code == 200, f"importa xml ({r.status_code})")
data = r.json()
nota = data["nota"]
nota_id = nota["id"]
check(nota["total_itens"] == 3, f"3 itens importados (veio {nota['total_itens']})")
check(nota["status"] == "aguardando_vinculo",
      f"status inicial aguardando_vinculo (veio {nota['status']}) - item 3 sem match")
print(f"    itens_identificados={nota['itens_identificados']}/3")

# 4) Descobre o item pendente (item 3) e vincula a P003
det = s.get(f"{BASE}/vinculacao/{nota_id}").json()
pendentes = det.get("pendentes", [])
check(len(pendentes) == 1, f"1 item pendente de vinculo (veio {len(pendentes)})")
item3 = pendentes[0]
r = s.post(f"{BASE}/conferencias/confirmar-vinculo",
           json={"item_nota_id": item3["id"], "produto_interno_id": ids["P003"], "origem_vinculo": "manual"})
check(r.status_code == 200, f"vincula item 3 -> P003 ({r.status_code})")

# 5) Status deve virar 'pendente' (laranja)
nota = next(n for n in s.get(f"{BASE}/notas").json() if n["id"] == nota_id)
check(nota["status"] == "pendente", f"status apos vinculo = pendente (veio {nota['status']})")

# 6) Inicia conferencia
r = s.post(f"{BASE}/conferencias/iniciar/{nota_id}")
check(r.status_code == 200, f"inicia conferencia ({r.status_code})")
itens = {i["produto_interno_codigo"]: i for i in r.json()["itens"]}

# 7) Bipa P001 (EAN) 3x -> completo
u1 = str(uuid.uuid4())
r = s.post(f"{BASE}/conferencias/leitura", json={"nota_id": nota_id, "codigo_barras": "7890000000017", "scan_uuid": u1})
d = r.json()
check(d["success"] and d["tipo"] == "parcial", f"1a leitura P001 parcial (veio {d.get('tipo')})")

# 7b) Idempotencia: reenviar o MESMO scan_uuid nao conta de novo
r = s.post(f"{BASE}/conferencias/leitura", json={"nota_id": nota_id, "codigo_barras": "7890000000017", "scan_uuid": u1})
d = r.json()
check(d.get("tipo") == "duplicado_ignorado", f"replay idempotente ignorado (veio {d.get('tipo')})")

# completa P001 (mais 2)
for _ in range(2):
    s.post(f"{BASE}/conferencias/leitura", json={"nota_id": nota_id, "codigo_barras": "7890000000017", "scan_uuid": str(uuid.uuid4())})

# 8) Bipa P002 (EAN) 2x
for _ in range(2):
    s.post(f"{BASE}/conferencias/leitura", json={"nota_id": nota_id, "codigo_barras": "7890000000024", "scan_uuid": str(uuid.uuid4())})

# 9) Item P003 nao tem codigo de barras -> usa endpoint adicionar-codigo-item
novo_ean = "7899999999999"
r = s.post(f"{BASE}/conferencias/adicionar-codigo-item",
           json={"nota_id": nota_id, "item_nota_id": itens["P003"]["id"], "codigo_barras": novo_ean, "scan_uuid": str(uuid.uuid4())})
d = r.json()
check(r.status_code == 200 and d["success"] and d["tipo"] == "completo",
      f"adiciona codigo em P003 e conta +1 (veio {d.get('tipo')})")

# 9b) O codigo foi salvo no produto P003?
p3 = s.get(f"{BASE}/produtos", params={"search": "P003"}).json()
p3 = next(x for x in p3 if x["codigo"] == "P003")
check(novo_ean in p3.get("codigos_barras", []), "codigo de barras salvo no cadastro do P003")

# 9c) Agora esse codigo deve ser reconhecido automaticamente (idempotencia impede recontagem, entao ja_conferido)
r = s.post(f"{BASE}/conferencias/leitura", json={"nota_id": nota_id, "codigo_barras": novo_ean, "scan_uuid": str(uuid.uuid4())})
d = r.json()
check(d.get("tipo") == "ja_conferido", f"novo codigo reconhecido no produto (veio {d.get('tipo')})")

# 10) Finaliza
r = s.post(f"{BASE}/conferencias/finalizar/{nota_id}", json={"operador": "TESTE E2E"})
check(r.status_code == 200, f"finaliza ({r.status_code})")
final = r.json()
check(final["status"] == "conferida", f"status final = conferida (veio {final['status']})")

print("\n== TODOS OS PASSOS PASSARAM ==")
