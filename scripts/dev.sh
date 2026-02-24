#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
frontend_dir="$root/frontend"
backend_dir="$root/apps/backend-web"

( cd "$frontend_dir" && bun run dev ) &
frontend_pid=$!

( cd "$backend_dir" && wrangler dev --env dev ) &
backend_pid=$!

trap 'kill $frontend_pid $backend_pid' SIGINT SIGTERM
wait $frontend_pid $backend_pid
