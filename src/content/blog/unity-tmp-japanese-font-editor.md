---
title: '【Unity】TextMeshProの日本語フォントアセットをEditorスクリプトで動的アトラスに生成する'
description: 'UnityのTextMeshProで、Noto Sans JPなどの日本語フォントを動的アトラス(Dynamic)のフォントアセットとしてEditorスクリプトから生成する方法。アトラスとマテリアルをサブアセットにする理由も。'
pubDate: 2026-10-08T10:10:00+09:00
qiita: [Unity, C#, TextMeshPro, 日本語, フォント]
---

UnityのTextMeshProで日本語を表示するとき、漢字を全部含んだフォントアセットを手作業で作ると、アトラスが巨大になって大変です。そこで『てるてるメガネ』では、**使われた文字だけを実行時に焼く動的アトラス(Dynamic)のフォントアセットを、Editorスクリプトで生成**しています。その作り方のメモです。

## 動的アトラスにする理由

静的アトラスは、あらかじめ文字を全部焼くので、日本語だとアトラスが大きくなります。動的アトラス(`AtlasPopulationMode.Dynamic`)は、画面に出た文字だけを後から焼くので、日本語のように文字数が多い言語に向いています。

さらに `isMultiAtlasTexturesEnabled` を有効にすると、1枚に入りきらなくなったときにアトラスが増えるので、足りなくなる心配がありません。

## フォントアセットを作る

`TMP_FontAsset.CreateFontAsset` に、元のフォントと各種の設定を渡します。

```csharp
TMP_FontAsset fontAsset = TMP_FontAsset.CreateFontAsset(
    sourceFont,               // 元の .ttf
    90,                       // サンプリングポイントサイズ
    9,                        // アトラスのパディング
    GlyphRenderMode.SDFAA,    // SDF(拡大しても綺麗)
    2048, 2048,               // アトラスのサイズ
    AtlasPopulationMode.Dynamic,
    true);                    // マルチアトラス対応

fontAsset.name = Path.GetFileNameWithoutExtension(assetPath);
fontAsset.atlasPopulationMode = AtlasPopulationMode.Dynamic;
fontAsset.isMultiAtlasTexturesEnabled = true;
AssetDatabase.CreateAsset(fontAsset, assetPath);
```

元のフォントは、`AssetDatabase.LoadAssetAtPath<Font>` で読み込みます。パスのフォントがUnityに取り込まれていないと `null` になるので、そのときは例外を投げて気づけるようにしています。

## アトラスとマテリアルをサブアセットにする

ここが一番のポイントです。`CreateFontAsset` が返すフォントアセットは、アトラスのテクスチャとマテリアルが**メモリ上にしかありません**。`AssetDatabase.CreateAsset` で保存しただけでは、この2つがアセットに含まれず、Unityを再起動したあとなどにTextコンポーネントへ割り当てられなくなります。

そのため、アトラスとマテリアルを、フォントアセットのサブアセットとして追加します。

```csharp
Texture2D atlasTexture = fontAsset.atlasTexture;
atlasTexture.name = $"{fontAsset.name} Atlas";
AssetDatabase.AddObjectToAsset(atlasTexture, fontAsset);

Material material = fontAsset.material;
material.name = $"{fontAsset.name} Material";
AssetDatabase.AddObjectToAsset(material, fontAsset);

EditorUtility.SetDirty(fontAsset);
EditorUtility.SetDirty(atlasTexture);
EditorUtility.SetDirty(material);
```

## 壊れていたら自動で作り直す

アセットが壊れた状態(アトラスやマテリアルがサブアセットになっていない)をチェックして、壊れていたら自動で作り直すようにもしています。`[InitializeOnLoad]` と `EditorApplication.delayCall` の組み合わせで、Editorの起動時に検査します。

```csharp
[InitializeOnLoad]
public static class GenerateNotoTMPFontAssets
{
    static GenerateNotoTMPFontAssets()
    {
        EditorApplication.delayCall += GenerateIfInvalid;
    }

    static bool IsValid(TMP_FontAsset f) =>
        f != null
        && f.atlasTexture != null
        && f.material != null
        && AssetDatabase.IsSubAsset(f.atlasTexture)
        && AssetDatabase.IsSubAsset(f.material);
}
```

`delayCall` を使うのは、静的コンストラクタが走る時点ではAssetDatabaseがまだ準備できていないことがあるためです。手動でも作り直せるように、`[MenuItem]` も付けておくと便利です。

## まとめ

- 日本語フォントは、動的アトラス + マルチアトラスで作ると、文字数が多くても扱いやすい
- `CreateFontAsset` のあとは、アトラスとマテリアルを `AddObjectToAsset` でサブアセットにする
- `[InitializeOnLoad]` で壊れたアセットを検出して作り直すと、環境が変わっても安心
