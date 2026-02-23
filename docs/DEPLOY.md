# デプロイ手順

## 前提条件

- [Cloudflare アカウント](https://dash.cloudflare.com/) と Wrangler CLI (`npm i -g wrangler`)
- [Google Cloud Console](https://console.cloud.google.com/) の OAuth 2.0 クライアントID/シークレット
- bun がインストール済み

---

## 1. バックエンド (Cloudflare Workers + D1)

### 1-1. Wrangler ログイン

```bash
wrangler login
```

### 1-2. D1 データベースを作成

```bash
wrangler d1 create bookie
```

出力例:

```
✅ Successfully created DB 'bookie'
{
  "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",   ← これを使う
  "name": "bookie"
}
```

### 1-3. wrangler.toml を編集

`apps/backend-web/wrangler.toml` の以下の項目を実際の値に書き換える:

```toml
[[d1_databases]]
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 上で取得したUUID

[vars]
GOOGLE_CLIENT_ID    = "your-client-id.apps.googleusercontent.com"
GOOGLE_REDIRECT_URI = "https://your-app.pages.dev/auth/callback"
FRONTEND_ORIGIN     = "https://your-app.pages.dev"
```

### 1-4. D1 スキーマを適用 (マイグレーション)

```bash
cd apps/backend-web

# 本番D1にスキーマを適用
wrangler d1 execute bookie --remote --file src/db/schema.sql
```

> ⚠️ 再実行しても `CREATE TABLE IF NOT EXISTS` で安全にスキップされる。

### 1-5. Google クライアントシークレットを登録

```bash
wrangler secret put GOOGLE_CLIENT_SECRET
# プロンプトにシークレット値を貼り付け
```

### 1-6. Workers をデプロイ

```bash
cd apps/backend-web
wrangler deploy
```

デプロイ後のURLを控えておく（例: `https://bookie-backend-web.your-subdomain.workers.dev`）

---

## 2. フロントエンド (Vite + Cloudflare Pages)

### 2-1. 環境変数ファイルを作成

```bash
cp frontend/.env.example frontend/.env.production
```

`frontend/.env.production` を編集:

```env
VITE_API_BASE_URL=https://bookie-backend-web.your-subdomain.workers.dev
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 2-2. ビルド

```bash
cd frontend
bun install
bun run build
```

`frontend/dist/` が生成される。

### 2-3. Cloudflare Pages にデプロイ

#### Wrangler CLI で直接:

```bash
wrangler pages deploy frontend/dist --project-name bookie-app
```

#### または Cloudflare ダッシュボードで:

1. Pages → プロジェクト作成 → Git に接続
2. ビルドコマンド: `cd frontend && bun install && bun run build`
3. ビルド出力ディレクトリ: `frontend/dist`
4. 環境変数に `VITE_API_BASE_URL` と `VITE_GOOGLE_CLIENT_ID` を設定

---

## 3. Google OAuth 設定

[Google Cloud Console](https://console.cloud.google.com/) → APIとサービス → 認証情報:

- **承認済みの JavaScript 生成元**: `https://your-app.pages.dev`
- **承認済みのリダイレクト URI**: `https://your-app.pages.dev/auth/callback`

---

## 4. デプロイ後の確認

```bash
# ヘルスチェック
curl https://bookie-backend-web.your-subdomain.workers.dev/health
# → "OK"

# D1テーブル確認
wrangler d1 execute bookie --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
# → users, sessions, books_master, user_books, reading_logs, laps, timer_sessions が含まれること
```

---

## 開発環境での起動

```bash
# バックエンド (ポート8787)
cd apps/backend-web
wrangler dev

# フロントエンド (ポート1430)
cd frontend
bun run dev
```

