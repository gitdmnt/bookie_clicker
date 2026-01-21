# Bookie Clicker

読書の計測・記録・可視化を行うデスクトップアプリ（Tauri + React）。
本棚から本を選び、タイマーで読書セッションを計測し、ラップメモを残してログ・統計を確認できます。

## 主な機能

- 本棚管理（検索/フィルタ）
- ISBN 検索（NDL API）による書誌取得
- バーコード画像からの ISBN 認識
- ラップタイマー & メモ（ラップごとのページ/メモ）
- 読書ログの保存・一覧
- 統計ダッシュボード（読書時間、セッション頻度、連続日数など）
- データエクスポート（JSON）

## 画面構成

- **Lapnote**: タイマー計測・ラップ記録・メモ入力
- **Bookshelf**: 本の検索/追加（ISBN、バーコード）
- **Logbook**: セッション履歴、ペース/頻度/ランキングなど
- **Stats**: 全体統計・ヒートマップ・累積グラフ
- **Debug**: デバッグ用ページ

## 技術スタック

- **フロントエンド**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **デスクトップ**: Tauri 2
- **バックエンド**: Rust
- **DB**: SurrealDB（開発はメモリ、リリースは RocksDB）
- **外部API**: NDL Search API
- **画像/バーコード**: image + rxing

## アーキテクチャ概要

- フロントエンドは Tauri の `invoke` を通じて Rust コマンドを呼び出し、
	書誌検索・バーコード認識・DB操作・タイマー制御を行います。
- タイマーはアプリ内メモリで管理され、`timer:tick` イベントで UI を更新します。
- 書誌情報は NDL API から取得し、ISBN・著者・出版社・ページ数などを保持します。

## データモデル（概要）

- **Book**: ISBN, タイトル, 著者, 出版社, 年, ページ数, 画像URL
- **ReadingLog**: 読書セッション（開始/終了ページ、時間、評価）
- **Lap**: セッション内ラップ（経過時間、メモ、参照ページ）

## 開発セットアップ

### 必要要件

- Node.js（または互換ランタイム）
- Rust（Tauri ビルド用）

### 開発起動

```bash
bun install
bun tauri:dev
```

### ビルド

```bash
bun tauri:build
```

### テスト

```bash
bun web:test
```

## ストレージについて

- 開発時は SurrealDB のメモリDBを使用
- 本番ビルドは `--features release-storage` で RocksDB を使用

## 主要ディレクトリ

- `apps/web/src/`: React UI
- `apps/web/src/pages/`: 画面ロジック
- `apps/web/src/hooks/`: 画面状態管理
- `apps/web/src/utils/api.ts`: Tauri コマンド呼び出し
- `apps/tauri/src-tauri/`: Rust バックエンド
- `apps/tauri/src-tauri/src/commands/`: Tauri コマンド実装
- `apps/tauri/src-tauri/src/db/`: DB操作とモデル
- `apps/tauri/src-tauri/src/timer/`: タイマー実装

## ライセンス

未記載
