// ブログ記事のうち frontmatter に `qiita:` (タグ) がある記事を、Qiita投稿用の
// qiita/public/<記事名>.md に変換して書き出す。使い方: npm run qiita:sync
//   例) qiita: [Unity, C#, ゲーム開発]   ← タグは1〜5個
// すでに Qiita に投稿済みの記事は、id / updated_at を引き継ぐ(再投稿で更新になる)。
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, extname } from 'node:path'

const SRC = new URL('../src/content/blog/', import.meta.url)
const OUT = new URL('../qiita/public/', import.meta.url)
const BLOG_URL = 'https://blog.soichi.dev/blog/'

mkdirSync(OUT, { recursive: true })

const field = (fm, key) => {
  const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : ''
}

let count = 0
for (const file of readdirSync(SRC)) {
  if (!['.md', '.mdx'].includes(extname(file))) continue
  const raw = readFileSync(new URL(file, SRC), 'utf8')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) continue
  const [, fm, rawBody] = m
  const tagLine = field(fm, 'qiita')
  if (!tagLine || field(fm, 'draft') === 'true') continue

  const tags = tagLine
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
  if (tags.length < 1 || tags.length > 5) {
    console.error(`${file}: タグは1〜5個にしてください`)
    process.exit(1)
  }

  const slug = basename(file, extname(file))
  // MDXの import を消し、キャラの吹き出しを引用に変換する
  const body = rawBody
    .replace(/^import .*\n/gm, '')
    .replace(/<TeruruTalk\s+text="([^"]*)"\s*\/>/g, '> てるる「$1」')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const out = new URL(`${slug}.md`, OUT)
  let id = 'null'
  let updated = "''"
  if (existsSync(out)) {
    const old = readFileSync(out, 'utf8')
    id = old.match(/^id: (.*)$/m)?.[1] ?? id
    updated = old.match(/^updated_at: (.*)$/m)?.[1] ?? updated
  }

  writeFileSync(
    out,
    `---
title: '${field(fm, 'title').replace(/'/g, "''")}'
tags:
${tags.map((t) => `  - '${t}'`).join('\n')}
private: false
updated_at: ${updated}
id: ${id}
organization_url_name: null
slide: false
ignorePublish: false
---

${body}

---

この記事は [個人ブログ](${BLOG_URL}${slug}/) にも掲載しています。
`,
  )
  console.log(`変換: qiita/public/${slug}.md (タグ: ${tags.join(', ')})`)
  count++
}
console.log(`${count}件を変換しました`)
