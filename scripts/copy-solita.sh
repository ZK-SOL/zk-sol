#!/bin/zsh
export ROOT="$(git rev-parse --show-toplevel)"
cd anchor
npm run solita
cd "${ROOT}"
\cp -fr "${ROOT}/anchor/solita/"* zkSOL-webapp/solita
\cp -fr "${ROOT}/anchor/solita/"* cloudflare-worker-typescript/src/solita
\cp -fr "${ROOT}/anchor/solita/"* cloudflare-page-app/src/solita
