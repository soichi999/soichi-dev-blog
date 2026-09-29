// 新しい記事のひな形を作る。使い方: npm run new -- my-post-slug
import { existsSync, writeFileSync } from 'node:fs'

const slug = process.argv[2]
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('使い方: npm run new -- 記事のURL名(半角英小文字・数字・ハイフン)\n例: npm run new -- unity-tips-01')
  process.exit(1)
}

const file = new URL(`../src/content/blog/${slug}.md`, import.meta.url)
if (existsSync(file)) {
  console.error(`すでに存在します: src/content/blog/${slug}.md`)
  process.exit(1)
}

// 日本時間の現在時刻 (2026-09-30T12:00:00+09:00 の形式)
const jst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 19)

writeFileSync(
  file,
  `---
title: ''
description: ''
pubDate: ${jst}+09:00
draft: true
---

ここに本文を書きます。

## 見出し

本文。
`,
)
console.log(`作成しました: src/content/blog/${slug}.md\n下書き(draft: true)なので公開されません。書き終えたら draft の行を消してください。\nnpm run dev で http://localhost:4321/blog/${slug}/ を開くとプレビューできます。`)
