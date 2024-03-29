# 機能

## 欲しい機能

1. ISBN から本を検索できる
2. 読んだ本/読みたい本を登録できる
3. 検索した本のページ数を引っ張ってきて記録できる
4. 月間何冊何ページ読んだかを記録できる
5. 記録をグラフで閲覧できる
6. グラフを期間指定して表示できる
7. 感想も持っておける
8. 何ページ目まで読んだかを記録しておける
9. ログインしてユーザー別に保持できるようにする

## コア機能

まず実装すべき機能

1. ISBN 検索
2. データベース

## データベース

やること

1. 必要な要素を列挙するよん
2. それをテーブルにするよ
3. 正規化するよ

### DB 構造

必要そうなもの

- メイン DB
  - ユーザー名
  - ISBN
  - 何周目か
  - 状態。未読/読書中/読了
  - 現在の進捗
  - カテゴリー
  - 感想
  - 評価
- ユーザーデータ
  - id
  - 名前
  - メール
  - パスワード(ハッシュ)
  - ソルト
  - カテゴリー一覧
  - 登録日
  - プロフィール

### 通信

クライアント-バックエンド間は http で通信する。
バックエンド-DB 間は websocket で通信する。

### 探索

- ログイン時に自分のユーザー名で検索して部分データベースを生成し、メモリの上に用意し、毎回それを参照する。
  - どうやって反映させる？
    - 書き込みは都度メイン DB の方に行う

# 開発環境

## 早見表

| あれ             | これ             | それ                                   |
| ---------------- | ---------------- | -------------------------------------- |
| バックエンド     | Rust             | Rust はおれの親なので                  |
| プラットフォーム | Web かなあ       | のちのちみんなで使えるようにしたいから |
| フレームワーク   | actix-web かなあ | これしか知らないから                   |
| フロントエンド   | React かなあ     | なんかいいらしいから                   |

## 分担

よく分かってない

### フロントエンド

- データからのグラフ生成
- 表示
- 入出力

### バックエンド

- データベースとのやり取り
- 外部 API とのやり取り

# そのほか

## 気になっている単語

- Next.js
  - これ何？
  - React の上に立っているフレームワークなのはわかる
  - バックエンドとの連携がわからん
  - actix 使いながら使えるの？
- CSS Grid
  - SSSS.GRIDMAN しか知らない
  - でもなんかいいらしい
  - OK

あああ
あああああ

