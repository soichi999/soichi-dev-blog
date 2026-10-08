---
title: '【Unity】文字列マップからTilemapのステージを自動生成するEditor拡張'
tags:
  - 'Unity'
  - 'C#'
  - 'Tilemap'
  - 'UnityEditor'
  - 'ゲーム開発'
private: false
updated_at: ''
id: null
organization_url_name: null
slide: false
ignorePublish: false
---

パズルゲームのステージをTilemapで1マスずつ手で塗っていると、ステージ数が増えるほど大変です。そこで、**文字列で描いたマップから、ステージをワンクリックで生成するEditor拡張**を作りました。個人開発中の『イロメガネ』のステージ作りで使っている方法のメモです。

## やりたいこと

- ステージの形をコードの中に、文字で書く
- メニューを押すと、Tilemapにタイルが敷かれ、スタート・ゴール・鍵のプレハブも置かれる
- 何度押しても、同じステージを作り直せる

## マップを文字列で書く

`#` は壁、`S` はスタート、`X` はゴール、`K` は鍵のように、1文字を1マスに対応させます。

```csharp
const string Map = @"
##########
#S.....K.#
#.####.#.#
#...K..#X#
##########
";
```

文字列は上の行が画面の上になるので、読み込むときに行番号を反転させます。

```csharp
string[] lines = Map.Trim('\r', '\n').Replace("\r", "").Split('\n');
int height = lines.Length, width = lines[0].Length;

for (int row = 0; row < height; row++)
{
    int y = height - 1 - row; // 先頭の行が一番上(y が最大)になる
    for (int x = 0; x < width; x++)
    {
        char c = lines[row][x];
        // c に応じてタイルやプレハブを置く
    }
}
```

## メニューから実行する

Editor拡張は `Editor` フォルダに置き、`[MenuItem]` を付けた static メソッドにします。

```csharp
using UnityEditor;
using UnityEngine;

public static class StageBuilder
{
    [MenuItem("Tools/Stage/ステージを作る")]
    static void Build()
    {
        if (Application.isPlaying) { Debug.LogWarning("再生中は実行できません"); return; }
        // ...
    }
}
```

`Application.isPlaying` で再生中の実行を止めているのは、再生中に変更したシーンは停止すると元に戻ってしまうためです。

## タイルを敷く

壁はルールタイルなど1種類のタイルを、`Tilemap.SetTile` で置いていきます。色ごとに壁を分けたいときは、色ごとにTilemapを用意して、文字から対応するTilemapを引く辞書を作っておくと簡単です。

```csharp
var maps = new Dictionary<char, Tilemap>(); // '#' → 白壁用、'R' → 赤壁用 ...

if (maps.TryGetValue(c, out var tm))
    tm.SetTile(new Vector3Int(x + offX, y + offY, 0), tile);
```

`offX` と `offY` は、ステージの中心がワールドの原点に来るようにずらす量です。

```csharp
int offX = -(width / 2), offY = -(height / 2);
```

敷き終わったら、更新と圧縮をしておきます。

```csharp
foreach (var tm in maps.Values)
{
    tm.RefreshAllTiles();
    tm.CompressBounds();
    EditorUtility.SetDirty(tm);
}
```

## プレハブを置く

スタート、ゴール、鍵は、プレハブを `PrefabUtility.InstantiatePrefab` で置きます。`Object.Instantiate` だとプレハブとのつながりが切れてしまうので、Editor拡張ではこちらを使います。

```csharp
var prefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Data/Prefab/Key.prefab");
var go = (GameObject)PrefabUtility.InstantiatePrefab(prefab, parent);
go.transform.localPosition = new Vector3(x + offX + 0.5f, y + offY + 0.5f, z);
```

`+ 0.5f` は、タイルの角ではなくマスの中心に置くための補正です。

## 作り直せるようにする

同じ名前のステージがすでにあったら、いったん消してから作り直します。ここを入れておくと、マップの文字を直して何度でも試せます。

```csharp
Transform old = stageRoot.transform.Find(name);
if (old != null) Object.DestroyImmediate(old.gameObject);
```

Editor拡張から生成したオブジェクトには、`Undo.RegisterCreatedObjectUndo` を付けておくと、Ctrl+Z で取り消せます。最後に `EditorSceneManager.MarkSceneDirty` を呼ぶのも忘れないでください。呼ばないと、保存の確認が出ません。

```csharp
Undo.RegisterCreatedObjectUndo(stage, "ステージを作る");
// ...
EditorSceneManager.MarkSceneDirty(stage.scene);
```

## まとめ

- ステージを文字列で書くと、見た目で形がわかり、差分もGitで読める
- `[MenuItem]` + `Tilemap.SetTile` + `PrefabUtility.InstantiatePrefab` で自動生成できる
- 作り直し、Undo、`MarkSceneDirty` を入れておくと、安心して何度も試せる

---

この記事は [個人ブログ](https://blog.soichi.dev/blog/unity-editor-stage-builder/) にも掲載しています。
