"""
Limpa os dados operacionais do banco (MongoDB), mantendo usuarios e config.
Uso: uv run --with pymongo --with dnspython python backend/scripts/clear_operational_data.py
"""
import os
from pymongo import MongoClient

# Colecoes que serao esvaziadas (dados operacionais).
COLLECTIONS_TO_CLEAR = [
    "notas",
    "itens_nota",
    "historico_leituras",
    "historico_aprendizado",
    "equivalencia_produtos",
    "produtos",
    "fornecedores",
]

# Colecoes preservadas (nunca apagadas por este script).
PRESERVED = ["usuarios", "config"]


def main():
    mongo_url = os.environ.get("MONGO_URL_2")
    db_name = os.environ.get("DB_NAME_2")
    if not mongo_url or not db_name:
        raise SystemExit("MONGO_URL_2 e DB_NAME_2 precisam estar definidos no ambiente.")

    client = MongoClient(mongo_url, serverSelectionTimeoutMS=15000)
    db = client[db_name]
    client.admin.command("ping")

    print(f"[v0] Conectado ao banco: {db_name}")
    print(f"[v0] Preservando: {', '.join(PRESERVED)}")

    total_removidos = 0
    for name in COLLECTIONS_TO_CLEAR:
        antes = db[name].count_documents({})
        res = db[name].delete_many({})
        total_removidos += res.deleted_count
        print(f"[v0] {name}: {antes} documentos -> removidos {res.deleted_count}")

    # Confirma o que restou nas colecoes preservadas.
    for name in PRESERVED:
        restantes = db[name].count_documents({})
        print(f"[v0] (preservado) {name}: {restantes} documentos mantidos")

    print(f"[v0] Concluido. Total de documentos removidos: {total_removidos}")
    client.close()


if __name__ == "__main__":
    main()
