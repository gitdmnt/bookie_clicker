# ログインフロー（Google OAuth + セッション）

このドキュメントは、フロントエンド〜バックエンド間のログインフローを、**どの段階でどこからどこへ通信が行われ、どのコンポーネントのどの関数が呼び出されるか**を中心に説明します。

## 1. ログイン開始（フロントエンド → Google）

**呼び出し元**
- コンポーネント: `AuthContext`（[frontend/src/contexts/AuthContext.tsx](frontend/src/contexts/AuthContext.tsx)）
- 関数: `login()`

**処理内容**
1. `login()` 内で PKCE を生成
   - `generateCodeVerifier()`
   - `generateCodeChallenge(verifier)`
2. `code_verifier` を `sessionStorage` に保存
3. Google OAuth 認可エンドポイントへリダイレクト
   - `window.location.href = https://accounts.google.com/o/oauth2/v2/auth?...`

**通信（ブラウザ → Google）**
- GET `https://accounts.google.com/o/oauth2/v2/auth`
- パラメータ: `client_id`, `redirect_uri`, `response_type=code`, `scope`, `code_challenge`, `code_challenge_method`

---

## 2. Google からのコールバック（Google → フロントエンド）

**呼び出し元**
- ルーティング: `/auth/callback`
- コンポーネント: `AuthCallback`（[frontend/src/pages/AuthCallback.tsx](frontend/src/pages/AuthCallback.tsx)）
- 関数: `handleCallback()`（`useEffect` で起動）

**処理内容**
1. URLのパラメータから `code` (認可コード) を取得
2. `sessionStorage` から `pkce_code_verifier` を取得
3. バックエンドに `code` と `code_verifier` を送信

**通信（フロントエンド → バックエンド）**
- POST `${API_BASE}/api/auth/google/callback`
- Body: `{ code, code_verifier }`
- `credentials: "include"` で Cookie 受信を許可

---

## 3. トークン交換とユーザー作成（バックエンド → Google → D1）

**呼び出し元**
- ハンドラ: `google_callback()`（[apps/backend-web/src/handlers/auth.rs](apps/backend-web/src/handlers/auth.rs)）

**処理内容**
1. `exchange_code_for_token(code, code_verifier, ctx)`
   - Google Token Endpoint へトークン交換
2. `decode_id_token(id_token)`
   - ID Token をデコードしてユーザー情報を取得
3. `UserManager::upsert_user(...)`
   - D1 にユーザーを作成/更新
4. `SessionManager::create_session(d1, user.id)`
   - セッションを作成して D1 に保存
5. `Set-Cookie` で `session` をクライアントに返却

**通信（バックエンド → Google）**
- POST `https://oauth2.googleapis.com/token`

**通信（バックエンド → D1）**
- `users` テーブル: 作成/更新
- `sessions` テーブル: セッション作成

---

## 4. クッキー受信とログイン完了（バックエンド → フロントエンド）

**呼び出し元**
- `google_callback()` が JSON レスポンスを返却

**処理内容**
- `Set-Cookie: session=...` がブラウザに保存される
- フロントエンドは `navigate("/")` でホームへ遷移

---

## 5. 認証状態の確認（フロントエンド → バックエンド）

**呼び出し元**
- コンポーネント: `AuthContext`（[frontend/src/contexts/AuthContext.tsx](frontend/src/contexts/AuthContext.tsx)）
- 関数: `checkAuth()`（`useEffect` で初回起動）

**処理内容**
1. `/api/auth/me` を呼び出し
2. Cookie の `session` を自動送信
3. ユーザー情報が返れば `setUser(userData)`

**通信（フロントエンド → バックエンド）**
- GET `${API_BASE}/api/auth/me`
- `credentials: "include"`

---

## 6. セッション検証（バックエンド → D1）

**呼び出し元**
- ハンドラ: `get_current_user()`（[apps/backend-web/src/handlers/auth.rs](apps/backend-web/src/handlers/auth.rs)）
- 関数: `extract_user_from_request(req, ctx)`

**処理内容**
1. `extract_session_token(req)`
   - `Cookie` から `session` を抽出
2. `SessionManager::get_session(d1, session_token)`
   - セッション取得
3. 期限チェック: `session.is_expired()`
4. `UserManager::get_user_by_id(d1, session.user_id)`
   - ユーザー情報取得

**通信（バックエンド → D1）**
- `sessions` テーブル参照
- `users` テーブル参照

---

## 7. ログアウト（フロントエンド → バックエンド）

**呼び出し元**
- コンポーネント: `AuthContext`
- 関数: `logout()`

**通信（フロントエンド → バックエンド）**
- POST `${API_BASE}/api/auth/logout`
- `credentials: "include"`

**バックエンド処理**
- `logout()`（[apps/backend-web/src/handlers/auth.rs](apps/backend-web/src/handlers/auth.rs)）
- `SessionManager::delete_session(d1, session_token)`
- `Set-Cookie: session=; Max-Age=0`

---

## 主要ファイル一覧

- フロントエンド
  - [frontend/src/contexts/AuthContext.tsx](frontend/src/contexts/AuthContext.tsx)
  - [frontend/src/pages/AuthCallback.tsx](frontend/src/pages/AuthCallback.tsx)
- バックエンド
  - [apps/backend-web/src/handlers/auth.rs](apps/backend-web/src/handlers/auth.rs)
  - [apps/backend-web/src/session.rs](apps/backend-web/src/session.rs)
