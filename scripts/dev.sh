#!/usr/bin/env bash
# Sobe o backend FastAPI (porta 8001) em segundo plano e o frontend Vite
# (porta 3000) em primeiro plano. O Vite faz proxy de /api -> :8001.
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VENV_DIR="$BACKEND_DIR/.venv"

echo "[dev] Preparando backend Python..."
if [ ! -d "$VENV_DIR" ]; then
  echo "[dev] Criando virtualenv..."
  python3 -m venv "$VENV_DIR"
fi

# shellcheck disable=SC1091
. "$VENV_DIR/bin/activate"

# Instala dependencias apenas se o uvicorn ainda nao estiver presente
if ! python -c "import uvicorn" >/dev/null 2>&1; then
  echo "[dev] Instalando dependencias do backend..."
  pip install --quiet --upgrade pip
  pip install --quiet -r "$BACKEND_DIR/requirements.txt"
fi

# Encerra qualquer backend anterior ocupando a porta 8001
fuser -k 8001/tcp >/dev/null 2>&1 || true
sleep 1

echo "[dev] Iniciando backend (uvicorn) na porta 8001..."
(
  cd "$BACKEND_DIR"
  exec uvicorn server:app --host 0.0.0.0 --port 8001
) &
BACKEND_PID=$!

# Garante que o backend seja encerrado junto com o script
trap 'kill "$BACKEND_PID" 2>/dev/null || true' EXIT INT TERM

echo "[dev] Iniciando frontend (vite) na porta 3000..."
cd "$ROOT_DIR"
exec node ./node_modules/vite/bin/vite.js
