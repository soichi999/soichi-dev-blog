#!/bin/sh
# 記事を公開する。使い方: npm run release -- "コミットメッセージ"
set -e
msg="${1:-記事を更新}"
npm run build >/dev/null
git add -A src/content src/assets public
git commit -m "$msg"
git push
echo "pushしました。1〜2分で https://blog.soichi.dev に反映されます。"
