---
title: '【Unity】Localizationの言語追加と翻訳投入をEditorスクリプトで一括化する'
tags:
  - 'Unity'
  - 'C#'
  - 'Localization'
  - '多言語対応'
  - 'UnityEditor'
private: false
updated_at: ''
id: null
organization_url_name: null
slide: false
ignorePublish: false
---

ゲームを多言語に対応させるとき、言語の追加と翻訳の入力をインスペクターから手でやると、手間もミスも増えます。『てるてるメガネ』では、**Localizationの言語追加と翻訳の投入を、Editorスクリプトとして一括化**しています。その考え方のメモです。

## 方針: 翻訳はコードに書かず、JSONで管理する

最初に決めたのは、翻訳の文章を**コードの中に書かない**ことです。訳は `CJKTranslations.json` のようなファイルに置き、Editorスクリプトはそれを読んで、Localizationのテーブルへ流し込むだけにします。

こうしておくと、訳の修正はJSONを直して、メニューをもう一度実行するだけで済みます。

## メニューを1つにまとめる

やることを1回のメニュー実行にまとめています。

- Localeを作って、Localization Settingsへ登録する
- テーブル(UIText や Scenario)に、言語ごとの表を作り、JSONの訳を入れる
- 画面のメッセージに、訳を入れる
- フォントがあれば、TextMeshProのフォールバックを作って登録する

```csharp
[MenuItem("Tools/Localization/翻訳を追加")]
public static void Run()
{
    var data = MiniJson.Parse(File.ReadAllText(JsonPath)) as Dictionary<string, object>;

    var locales = EnsureLocales();
    int tableCount = FillTables(data, locales);
    int entryCount = AddEntries(data);
    string fontResult = SetupFonts();

    AssetDatabase.SaveAssets();
    Debug.Log($"完了: テーブルの訳 {tableCount}件 / 項目 {entryCount}件 / フォント: {fontResult}");
}
```

## 何度実行しても重複しないようにする

一括化するうえで大事なのは、**何度実行しても重複しない**ことです。たとえばLocaleは、すでにあれば作らず、なければ作って登録します。

```csharp
static Locale[] EnsureLocales()
{
    var result = new Locale[Codes.Length]; // { "zh-Hans", "zh-Hant", "ko" }
    var existing = LocalizationEditorSettings.GetLocales();
    for (int i = 0; i < Codes.Length; i++)
    {
        Locale locale = existing.FirstOrDefault(l => l.Identifier.Code == Codes[i]);
        if (locale == null)
        {
            locale = Locale.CreateLocale(new LocaleIdentifier(Codes[i]));
            AssetDatabase.CreateAsset(locale, $"Assets/{LocaleNames[i]}.asset");
            LocalizationEditorSettings.AddLocale(locale, false);
        }
        result[i] = locale;
    }
    return result;
}
```

テーブルの項目も同じ考え方で、「あれば上書き、なければ追加」にします。こうすると、JSONを直してから何度でも実行できます。

## 訳が足りないときは警告を出す

JSONにない文章があったときは、黙って空にせず、Consoleに警告を出すようにしています。訳の入れ忘れにすぐ気づけます。

## フォントのフォールバックも忘れずに

中国語や韓国語を追加すると、日本語のフォントに入っていない文字が出てきます。そのため、各言語のフォントを、TextMeshProのフォールバックとして登録しておきます。フォントがなければ、スキップして結果をログに出すだけにしています。

## まとめ

- 翻訳はJSONで管理し、Editorスクリプトでテーブルに流し込む
- Locale作成、テーブル作成、翻訳投入、フォント登録を1つのメニューにまとめる
- 「あれば更新、なければ追加」にして、何度実行しても重複しないようにする
- 足りない訳は警告を出して、入れ忘れに気づけるようにする

---

この記事は [個人ブログ](https://blog.soichi.dev/blog/unity-localization-batch-editor/) にも掲載しています。
