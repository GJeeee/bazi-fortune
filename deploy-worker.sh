#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/cloudflare-worker"

if ! command -v npm >/dev/null 2>&1; then
  echo "请先安装 Node.js 和 npm"
  exit 1
fi

if [ ! -f .dev.vars ] && [ -z "${DEEPSEEK_API_KEY:-}" ]; then
  echo "提示：本地调试可复制 .dev.vars.example 为 .dev.vars 并填入 DeepSeek Key"
  echo "生产环境请在 Cloudflare Dashboard → Worker → Settings → Variables 添加 Secret：DEEPSEEK_API_KEY"
fi

npm install
npx wrangler deploy

echo ""
echo "部署完成。请把 Worker 地址写入 js/ai-config.js 的 workerUrl，例如："
echo "  workerUrl: 'https://bazi-fortune-ai.你的账号.workers.dev',"
echo ""
echo "然后重新部署 GitHub Pages：cd .. && ./deploy.sh"
