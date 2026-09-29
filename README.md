# 伊藤颯一 Dev Blog

Astro製。`main` に push すると Cloudflare Workers で https://blog.soichi.dev に自動公開されます。

記事の書き方は [WRITING.md](WRITING.md) を見てください。

| コマンド | 内容 |
|---|---|
| `npm run new -- URL名` | 記事のひな形を作る |
| `npm run dev` | http://localhost:4321 でプレビュー |
| `npm run release -- "メッセージ"` | ビルド確認 → commit → push |
