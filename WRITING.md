# 記事の書き方

記事は `src/content/blog/` の Markdown ファイル1つが1記事です。ファイル名がそのままURLになります
(`hello.md` → `https://blog.soichi.dev/blog/hello/`)。

## 1. ひな形を作る

```sh
npm run new -- unity-tips-01
```

`src/content/blog/unity-tips-01.md` ができます。URL名は半角英小文字・数字・ハイフンだけ。

## 2. 書く

ファイルの先頭 (`---` で囲まれた部分) に3つ書きます。

| 項目 | 内容 |
|---|---|
| `title` | 記事タイトル |
| `description` | 検索結果に出る説明文 (80〜120字くらい) |
| `pubDate` | 公開日時 (ひな形が現在時刻を入れてくれる) |
| `draft` | `true` の間は非公開。公開するときに行ごと消す |

本文は Markdown です。`## 見出し`、`- 箇条書き`、`[リンク](https://...)`、`` `コード` `` などが使えます。
画像は `public/images/` に置き、`![説明](/images/ファイル名.png)` で貼ります。

## 3. プレビュー

```sh
npm run dev
```

http://localhost:4321/blog/ を開くと、保存するたびに画面が更新されます。

## 4. 公開

```sh
npm run publish -- "記事「〇〇」を追加"
```

ビルド確認 → commit → push まで行い、1〜2分でブログに反映されます。
公式サイト (soichi.dev) の最新3件は、翌朝6時に自動で入れ替わります。

## 下書き

ひな形には `draft: true` が入っていて、この間はサイトに出ません(`npm run dev` のプレビューでは見えます)。
公開したくなったら、その行を消して `npm run publish` します。
