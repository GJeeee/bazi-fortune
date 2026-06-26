#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

GH=""
if command -v gh >/dev/null 2>&1; then
  GH=gh
elif [ -x /tmp/gh_2.67.0_macOS_arm64/bin/gh ]; then
  GH=/tmp/gh_2.67.0_macOS_arm64/bin/gh
else
  echo "正在下载 GitHub CLI..."
  ARCH="$(uname -m)"
  curl -fsSL "https://github.com/cli/cli/releases/download/v2.67.0/gh_2.67.0_macOS_${ARCH}.zip" -o /tmp/gh.zip
  unzip -qo /tmp/gh.zip -d /tmp
  GH="/tmp/gh_2.67.0_macOS_${ARCH}/bin/gh"
fi

if ! "$GH" auth status >/dev/null 2>&1; then
  echo "请在浏览器中完成 GitHub 登录..."
  "$GH" auth login --web --git-protocol https
fi

REPO_NAME="${1:-bazi-fortune}"
USER="$("$GH" api user -q .login)"
REMOTE="https://github.com/${USER}/${REPO_NAME}.git"

if ! "$GH" repo view "${USER}/${REPO_NAME}" >/dev/null 2>&1; then
  "$GH" repo create "$REPO_NAME" --public --source=. --remote=origin --push --description "八字今日运势"
else
  git remote remove origin 2>/dev/null || true
  git remote add origin "$REMOTE"
  git push -u origin main
fi

"$GH" api "repos/${USER}/${REPO_NAME}/pages" -X POST \
  -f build_type=workflow \
  -f source[branch]=main \
  -f source[path]=/ 2>/dev/null || true

echo ""
echo "发布完成！"
echo "仓库: https://github.com/${USER}/${REPO_NAME}"
echo "网站: https://${USER}.github.io/${REPO_NAME}/"
echo ""
echo "若 GitHub Pages 尚未生效，请到仓库 Settings → Pages，Source 选择 GitHub Actions。"
