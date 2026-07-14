"""
Limpa os dados operacionais do banco (MongoDB), mantendo usuarios e config.
Uso: python backend/scripts/clear_operational_data.py
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

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


async def main():
    mongo_url = os.environ.get("MONGO_URL_2")
    db_name = os.environ.get("DB_NAME_2")
    if not mongo_url or not db_name:
        raise SystemExit("MONGO_URL_2 e DB_NAME_2 precisam estar definidos no ambiente.")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print(f"[v0] Conectado ao banco: {db_name}")
    print(f"[v0] Preservando: {', '.join(PRESERVED)}")

    total_removidos = 0
    for name in COLLECTIONS_TO_CLEAR:
        antes = await db[name].count_documents({})
        res = await db[name].delete_many({})
        total_removidos += res.deleted_count
        print(f"[v0] {name}: {antes} documentos -> removidos {res.deleted_count}")

    # Confirma o que restou nas colecoes preservadas.
    for name in PRESERVED:
        restantes = await db[name].count_documents({})
        print(f"[v0] (preservado) {name}: {restantes} documentos mantidos")

    print(f"[v0] Concluido. Total de documentos removidos: {total_removidos}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
