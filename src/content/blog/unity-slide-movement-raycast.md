---
title: '【Unity技術メモ】壁まで滑るスリップ移動をRaycastで作る'
description: '2Dパズルで使う「壁に当たるまで滑り続ける移動」の実装方法と、Raycastまわりでハマった落とし穴のメモ。'
pubDate: 2026-09-24T10:00:00+09:00
---

開発中のパズルゲーム『イロメガネ』では、キャラクターが**壁に当たるまで一方向へ滑り続ける**移動を使っています。この記事では、その実装方針と、作っていて実際にハマったポイントをメモしておきます。

## 方針: 物理エンジンに任せず、Raycastで止める位置を決める

最初に決めたのは「移動は自前で制御する」ことです。

- `Rigidbody2D` は **Static** にして、`transform` を直接動かす
- 壁との衝突は物理演算ではなく **`Physics2D.Raycast`** で判定する

`Kinematic` + `MovePosition` も試しましたが、パズルで欲しい「ピタッと止まる」感触にならなかったので戻しました。マス目に沿って正確に止まることが大事なゲームでは、物理エンジンの当たり判定に任せるより、止まる座標を自分で計算するほうが安定します。

## 最小の実装

考え方は次のとおりです。

1. 入力を受けたら、その方向にすでに壁が隣接していないか確認して、動き出す
2. 毎フレーム、進行方向へRaycastを飛ばす
3. 壁に当たったら、**壁の面から体の半径ぶん手前**にぴたりと座標を合わせて停止する

```csharp
using UnityEngine;

public class SlideMover : MonoBehaviour
{
    [SerializeField] float moveSpeed = 12f;
    [SerializeField] float playerRadius = 0.5f;
    [SerializeField] float skinWidth = 0.05f;
    [SerializeField] LayerMask wallLayer;

    Vector2 _direction;
    bool _isMoving;

    public void TryStartMove(Vector2 direction)
    {
        if (_isMoving) return;

        // すでに壁に接している方向へは動き出さない
        var hit = Physics2D.Raycast(transform.position, direction, playerRadius + skinWidth, wallLayer);
        if (hit.collider != null) return;

        _direction = direction;
        _isMoving = true;
    }

    void Update()
    {
        if (!_isMoving) return;

        float step = moveSpeed * Time.deltaTime;
        Vector2 origin = transform.position;

        // 体の半径 + 今フレームの移動量 + 少しの余裕 まで先を見る
        var hit = Physics2D.Raycast(origin, _direction, playerRadius + step + skinWidth, wallLayer);

        if (hit.collider != null)
        {
            // 壁の面から半径ぶん手前にぴったり止める
            transform.position = origin + _direction * (hit.distance - playerRadius);
            _isMoving = false;
            return;
        }

        transform.position = origin + _direction * step;
    }
}
```

ポイントは、停止位置を `origin + 方向 * (hit.distance - 半径)` で求めているところです。`hit.distance` は「Rayの開始点から壁の面まで」の距離なので、そこから体の半径を引けば、体の縁がちょうど壁に接する中心座標になります。

## ハマった落とし穴

### 1. 体が大きいときは、Rayを何本か飛ばす必要がある

中心から1本だけRayを飛ばす方式だと、体が大きくなったとき、体の端だけが壁にかかる位置をすり抜けます。そこで、進行方向に対して**垂直にオフセットした複数本のRay**を飛ばす方式にしました。

このとき、`hit.point` をそのまま停止位置に使うとバグります。オフセットした光線のヒット点は、中心からずれた場所の点だからです。その結果、停止位置が垂直方向にずれて、**座標が少しずつズレていく**不具合になりました。

対策は、`hit.point` は使わず、**「中心の座標 + 進行方向 × 距離」で求め直す**ことです。オフセットは進行方向に対して垂直にしか付けていないので、進行方向成分の距離(`hit.distance`)は、どの光線でも中心からの距離と同じになります。

### 2. コライダーの内側から撃つと `distance = 0` が返る

Unityでは、Rayの開始点がすでにコライダーの内側にあると、そのコライダーに**距離0でヒット**します(`Physics2D.queriesStartInColliders` の既定挙動)。

通り抜けられる壁のギミックを作ったとき、「ヒットしたら少し先へ進めてもう一度Raycast」を繰り返す方式にしたら、厚い壁の中にいる間ずっと距離0が返り続けて、**入ったら出られない**状態になりました。

「Rayが壁に当たるか」ではなく、「その地点が実際に壁の中か」だけを知りたい場面では、`Physics2D.OverlapPoint` を一定間隔で並べて調べる方式のほうが安定します。開始点が中にあるかどうかに結果が左右されないためです。

### 3. `RaycastAll` の順序は保証されない

一度に全部取れて便利な `RaycastAll` ですが、結果が距離順に並ぶとは保証されていません。「一番近い壁」を使うつもりで先頭要素を見ていたら、まれに手前の壁が判定から漏れてすり抜けが起きました。近いものだけが必要なら、単発の `Raycast` か、自分で距離順にソートしましょう。

## まとめ

- 停止位置が大事なゲームは、物理任せにせず**Raycastで止める座標を自前で計算**する
- 複数本のRayを使うときは、`hit.point` ではなく**中心 + 方向 × 距離**で位置を求める
- コライダー内側からのRayは `distance = 0` になる。「壁の中か」を知りたいなら `OverlapPoint` を使う
- `RaycastAll` の順序は当てにしない

同じ仕組みを作る方の参考になればうれしいです。
