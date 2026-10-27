#!/usr/bin/env bash
set -euo pipefail

# Production pages query Prisma-backed content at render time. Apply committed
# migrations before building so a fresh production database can serve them.
if [[ "${VERCEL_ENV:-}" == "production" ]]; then
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "DATABASE_URL is required for production migrations." >&2
    exit 1
  fi

  pnpm db:migrate:deploy
fi

pnpm build
