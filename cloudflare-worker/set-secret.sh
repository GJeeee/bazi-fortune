#!/bin/bash
# 方式 A：从命令行把 DeepSeek Key 写入 Cloudflare（不会提交到 Git）
set -euo pipefail
cd "$(dirname "$0")"

if [ -f .dev.vars ]; then
  KEY="$(grep '^DEEPSEEK_API_KEY=' .dev.vars | cut -d= -f2- | tr -d '\r' || true)"
  if [ -n "$KEY" ] && ! echo "$KEY" | grep -q '在此粘贴'; then
    printf '%s' "$KEY" | npx wrangler secret put DEEPSEEK_API_KEY
    echo "✓ 密钥已写入 Cloudflare"
    exit 0
  fi
fi

echo "请在终端执行（粘贴 sk-... 后按回车，输入不会显示）："
echo "  npx wrangler secret put DEEPSEEK_API_KEY"
echo ""
echo "或把密钥写入 .dev.vars 后重新运行本脚本："
echo "  echo 'DEEPSEEK_API_KEY=sk-你的密钥' > .dev.vars"
echo "  ./set-secret.sh"
