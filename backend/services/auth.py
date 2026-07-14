"""Autenticacao e autorizacao: hashing de senha, JWT e papeis/permissoes."""
import os
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta

# Chave de assinatura do JWT. Em producao, defina JWT_SECRET nas variaveis.
JWT_SECRET = os.environ.get("JWT_SECRET", "nfe-check-dev-secret-troque-em-producao")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 12

# ── Papeis ─────────────────────────────────────────────────────────
ROLE_ADMIN = "admin"
ROLE_GERENTE = "gerente"
ROLE_COMPRADOR = "comprador"
ROLE_ESTOQUISTA = "estoquista"

ROLES = [ROLE_ADMIN, ROLE_GERENTE, ROLE_COMPRADOR, ROLE_ESTOQUISTA]

ROLE_LABELS = {
    ROLE_ADMIN: "Administrador",
    ROLE_GERENTE: "Gerente",
    ROLE_COMPRADOR: "Comprador",
    ROLE_ESTOQUISTA: "Estoquista",
}

# ── Permissoes ─────────────────────────────────────────────────────
# Cada permissao mapeia para os papeis que a possuem.
PERM_VIEW = "view"                    # ver dashboard, notas, produtos
PERM_CONFERIR = "conferir"            # realizar conferencia
PERM_NOTAS = "gerenciar_notas"        # adicionar/importar/excluir notas (incl. SEFAZ)
PERM_CADASTROS = "gerenciar_cadastros"  # produtos, fornecedores, vinculos, equivalencias
PERM_RELATORIOS = "relatorios"        # relatorios de conferencia
PERM_USUARIOS = "gerenciar_usuarios"  # painel de usuarios

PERMISSIONS = {
    PERM_VIEW: {ROLE_ADMIN, ROLE_GERENTE, ROLE_COMPRADOR, ROLE_ESTOQUISTA},
    PERM_CONFERIR: {ROLE_ADMIN, ROLE_GERENTE, ROLE_COMPRADOR, ROLE_ESTOQUISTA},
    PERM_NOTAS: {ROLE_ADMIN, ROLE_GERENTE, ROLE_COMPRADOR},
    PERM_CADASTROS: {ROLE_ADMIN, ROLE_GERENTE, ROLE_COMPRADOR},
    PERM_RELATORIOS: {ROLE_ADMIN, ROLE_GERENTE},
    PERM_USUARIOS: {ROLE_ADMIN},
}


def role_has_permission(role: str, permission: str) -> bool:
    return role in PERMISSIONS.get(permission, set())


def permissions_for_role(role: str) -> list:
    return [perm for perm, roles in PERMISSIONS.items() if role in roles]


# ── Senha ──────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


# ── JWT ────────────────────────────────────────────────────────────
def create_token(user_id: str, username: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "iat": now,
        "exp": now + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
