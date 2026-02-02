#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env"

if ! command -v docker &>/dev/null; then
  echo "Docker is not installed. Please install Docker first."
  exit 1
fi
if ! docker compose version &>/dev/null && ! docker-compose version &>/dev/null; then
  echo "Docker Compose is not installed. Please install Docker Compose."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ROOT_DIR/.env.example" ]; then
    cp "$ROOT_DIR/.env.example" "$ENV_FILE"
    echo "Created .env from .env.example. Please review and edit .env if needed."
  else
    echo "No .env or .env.example found. Creating minimal .env."
    echo "JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo 'change-me-in-production')" > "$ENV_FILE"
  fi
fi

source "$ENV_FILE" 2>/dev/null || true
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "change-me-in-production" ] || [ "$JWT_SECRET" = "change-me-in-production-use-openssl-rand-hex-32" ]; then
  export JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "fallback-secret-$(date +%s)")
  if grep -q '^JWT_SECRET=' "$ENV_FILE" 2>/dev/null; then
    sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE" 2>/dev/null || true
  else
    echo "JWT_SECRET=$JWT_SECRET" >> "$ENV_FILE"
  fi
fi

cd "$ROOT_DIR"
docker compose -f deploy/docker-compose.yml --env-file "$ENV_FILE" build
docker compose -f deploy/docker-compose.yml --env-file "$ENV_FILE" up -d
if [ "${SEED_DEMO:-}" = "true" ]; then
  echo "Waiting for backend, then running seed (SEED_DEMO=true)..."
  for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 3
    if docker compose -f deploy/docker-compose.yml --env-file "$ENV_FILE" exec -T backend node scripts/seed.js 2>/dev/null; then
      echo "Seed completed."
      break
    fi
    [ "$i" = 10 ] && echo "Seed skipped or failed (backend may still be starting). Run: docker compose -f deploy/docker-compose.yml exec backend node scripts/seed.js"
  done
fi
echo "Stack started. Access the app at http://localhost (or http://SERVER_IP if on VPS)."
echo "Demo login: admin@demo.com / DemoAdmin123!"