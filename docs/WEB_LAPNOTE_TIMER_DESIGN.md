# Web版 LapnoteTimer 設計仕様書

## 1. 概要

本ドキュメントでは、Bookie ClickerのWeb版におけるLapnoteTimer機能の設計について、提案された方式を批判的に検討し、最終的な仕様を定めます。

### 1.1 現状の課題

**Tauri版の実装（現行）:**

- バックエンド（Rust）側でタイマーステート（経過時間、ラップノート）を保持
- フロントエンドは単なるビューとして機能
- イベント駆動でタイマーのtickをフロントエンドに通知
- 全データをバックエンドで管理するため、データの一貫性が保証される

**Web版の制約:**

- Cloudflare Workersはステートレスな環境
- WebSocketやイベント駆動アーキテクチャが利用できない（または複雑）
- セッション管理やリアルタイム通信に制約がある

### 1.2 提案された設計

> - Timerスタート/ストップ時にチケット？を発行し、バックエンドに記録しておく。
> - 時間の表示はフロントエンドで計算して行う。
> - 記録セーブ時に信号をバックエンドに送り、バックエンドでチケットを全部まとめて記録する。チケットは全部消去する。
> - Lapnote自体はセーブ時にまとめてバックエンドに送信する。

---

## 2. 提案設計の批判的検討

### 2.1 問題点の分析

#### 2.1.1 「チケット」の概念が不明瞭

**問題:**

- 「チケット」が何を表すのか（開始時刻、停止時刻、セッションID等）が明確でない
- チケットのライフサイクル管理が複雑になる可能性がある
- チケットの永続化場所（D1 DB? KV? Durable Objects?）が未定義

**推奨事項:**
より明確な概念として「タイマーセッション (TimerSession)」を提案します。

#### 2.1.2 データ整合性のリスク

**問題:**

- フロントエンドで時間計算を行う場合、以下のリスクがある：
  - ユーザーがブラウザを閉じた場合のデータ損失
  - ブラウザのタブをスリープした場合の時間計算の不正確性
  - システム時計の変更による影響
  - 複数デバイスからの同時アクセス時の競合

**具体例:**

```javascript
// フロントエンドで計算する場合の問題例
const startTime = Date.now();
// ... ユーザーがタブを閉じる
// ... 再度開く → startTimeが失われる
```

#### 2.1.3 セキュリティ上の懸念

**問題:**

- フロントエンドで時間を計算する場合、クライアント側で時間を改ざん可能
- 統計データの信頼性が低下する

**攻撃シナリオ:**

```javascript
// 悪意あるユーザーが時間を改ざん
const fakeSessionDuration = 99999; // 実際より長い時間を送信
await api.saveLaps({ sessionDuration: fakeSessionDuration, ... });
```

#### 2.1.4 状態管理の複雑化

**問題:**

- バックエンドとフロントエンドで状態が分散する（バックエンド: チケット、フロントエンド: 経過時間、ラップノート）
- 状態の同期が必要になり、実装が複雑化する
- デバッグが困難になる

#### 2.1.5 Cloudflare Workersの制約

**Workersの特性:**

- リクエスト単位で実行される（ステートレス）
- CPU時間制限（10ms〜50ms）
- 永続的な接続を保持できない

**この設計における課題:**

- 「チケットを記録」するためのストレージが必要
- D1（SQLite）は書き込み遅延がある
- KVは最終的一貫性モデルで、即座の読み取り保証がない

### 2.2 代替設計の比較

#### オプションA: フロントエンド完結型（提案に近い）

```
┌─────────────┐
│ Frontend    │
│ - Timer計算 │
│ - Lap保持   │
└──────┬──────┘
       │ 保存時のみ通信
┌──────▼──────┐
│ Backend     │
│ - DB保存    │
└─────────────┘
```

**メリット:**

- バックエンドの負荷が最小
- オフライン対応が容易

**デメリット:**

- データ損失リスク（ブラウザクラッシュ、誤操作等）
- 時間の正確性が保証できない
- セキュリティリスク
- 複数デバイス同期が困難

#### オプションB: セッションベース（推奨案）

```
┌─────────────────┐
│ Frontend        │
│ - UI表示        │
│ - Lap一時保持   │
└────────┬────────┘
         │ 定期的なハートビート/保存
┌────────▼────────┐
│ Backend         │
│ - Session管理   │
│ - 時間計算      │
│ - 状態永続化    │
└─────────────────┘
```

**メリット:**

- データの一貫性と正確性が保証される
- セキュリティが向上
- 複数デバイスからの状態確認が可能
- サーバー側で異常検知が可能

**デメリット:**

- バックエンドの複雑性が増す
- ネットワーク断時の対処が必要

#### オプションC: ハイブリッド型（バランス案）

```
┌─────────────────────┐
│ Frontend            │
│ - Timer表示計算     │
│ - Lap一時保持       │
│ - LocalStorage同期  │
└──────┬──────────────┘
       │ 重要イベント時に通信
┌──────▼──────────────┐
│ Backend             │
│ - Session記録       │
│ - 最終検証・保存    │
└─────────────────────┘
```

**メリット:**

- オフライン耐性とデータ整合性のバランス
- ネットワーク負荷が低い
- 柔軟なエラーハンドリング

**デメリット:**

- 実装の複雑性が中程度
- 時刻同期の仕組みが必要

---

## 3. 推奨設計: ハイブリッド型セッション管理

### 3.1 アーキテクチャ概要

```
┌─────────────────────────────────────┐
│ Frontend (React)                    │
│ ┌─────────────────────────────────┐ │
│ │ useLapnoteTimer Hook            │ │
│ │ - LocalStorage永続化            │ │
│ │ - Performance.now()で時間計測   │ │
│ │ - Lap一時保存                   │ │
│ └─────────────────────────────────┘ │
└───────────┬─────────────────────────┘
            │
            │ ① Start → POST /api/timer/sessions
            │ ② Lap追加 → POST /api/timer/sessions/:id/laps
            │ ③ Stop → PATCH /api/timer/sessions/:id/stop
            │ ④ Save → POST /api/laps (既存API)
            │
┌───────────▼─────────────────────────┐
│ Backend (Cloudflare Workers)        │
│ ┌─────────────────────────────────┐ │
│ │ TimerSession管理                │ │
│ │ - D1 (sessions テーブル)        │ │
│ │ - start_time, stop_time記録     │ │
│ │ - サーバー時刻で検証            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 3.2 データモデル

#### 3.2.1 新規テーブル: timer_sessions

```sql
CREATE TABLE timer_sessions (
    id TEXT PRIMARY KEY,                    -- ULID or UUID
    user_id TEXT NOT NULL,                  -- 認証ユーザーID
    start_time TEXT NOT NULL,               -- ISO 8601 タイムスタンプ
    stop_time TEXT,                         -- ISO 8601 タイムスタンプ (NULL = 進行中)
    is_saved BOOLEAN DEFAULT FALSE,         -- reading_logsに保存済みか
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_timer_sessions_user ON timer_sessions(user_id);
CREATE INDEX idx_timer_sessions_saved ON timer_sessions(is_saved);
```

#### 3.2.2 新規テーブル: timer_laps (一時保存用)

```sql
CREATE TABLE timer_laps (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    elapsed_ms INTEGER NOT NULL,            -- セッション開始からの経過ミリ秒
    note TEXT NOT NULL,
    ref_page INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES timer_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_timer_laps_session ON timer_laps(session_id);
```

### 3.3 API設計

#### 3.3.1 タイマーセッション開始

**Endpoint:** `POST /api/timer/sessions`

**Request:**

```json
{}
```

**Response:**

```json
{
  "id": "01HQXXXXXXXXXXXXXXXXXXXX",
  "startTime": "2026-02-13T10:30:00Z",
  "isRunning": true
}
```

**処理:**

1. 認証ユーザーの既存の進行中セッションをチェック
2. 既存の進行中セッションがあれば、それを返す（または警告）
3. 新規セッションをD1に作成（`start_time = NOW()`）
4. セッションIDをクライアントに返す

#### 3.3.2 タイマーセッション停止

**Endpoint:** `PATCH /api/timer/sessions/:id/stop`

**Request:**

```json
{}
```

**Response:**

```json
{
  "id": "01HQXXXXXXXXXXXXXXXXXXXX",
  "startTime": "2026-02-13T10:30:00Z",
  "stopTime": "2026-02-13T11:15:00Z",
  "durationSec": 2700,
  "isRunning": false
}
```

**処理:**

1. セッションの存在と所有者を確認
2. `stop_time = NOW()` を記録
3. 経過時間を計算して返す

#### 3.3.3 Lap追加（オプション: バックアップ用）

**Endpoint:** `POST /api/timer/sessions/:id/laps`

**Request:**

```json
{
  "elapsedMs": 120000,
  "note": "第1章読了",
  "refPage": 45
}
```

**Response:**

```json
{
  "id": "01HQYYXXXXXXXXXXXXXXXXXX",
  "sessionId": "01HQXXXXXXXXXXXXXXXXXXXX",
  "elapsedMs": 120000,
  "note": "第1章読了",
  "refPage": 45,
  "createdAt": "2026-02-13T10:32:00Z"
}
```

**処理:**

1. セッションの存在と所有者を確認
2. `timer_laps` テーブルに保存

#### 3.3.4 セッション保存（最終記録）

**Endpoint:** `POST /api/timer/sessions/:id/save`

**Request:**

```json
{
  "isbn": 9784001234567,
  "firstPage": 1,
  "lastPage": 45,
  "rating": 5,
  "laps": [
    {
      "elapsedMs": 120000,
      "note": "第1章読了",
      "refPage": 45
    }
  ],
  "clientCalculatedDurationSec": 2700
}
```

**Response:**

```json
{
  "readingLogId": "01HQZZXXXXXXXXXXXXXXXXXX",
  "sessionDurationSec": 2700,
  "lapCount": 1
}
```

**処理:**

1. セッションの存在、所有者、未保存を確認
2. サーバー側で時間を再計算（`stop_time - start_time`）
3. クライアント計算値との差異が大きい場合は警告（許容誤差: ±10秒）
4. `reading_logs` にレコード作成
5. `laps` テーブルに各Lapを作成（reading_log_idを関連付け）
6. セッションを `is_saved = TRUE` に更新
7. `timer_laps` テーブルから該当Lapを削除（オプション）

#### 3.3.5 セッション取得（状態復元用）

**Endpoint:** `GET /api/timer/sessions/current`

**Response:**

```json
{
  "session": {
    "id": "01HQXXXXXXXXXXXXXXXXXXXX",
    "startTime": "2026-02-13T10:30:00Z",
    "stopTime": null,
    "isRunning": true
  },
  "laps": [
    {
      "id": "01HQYYXXXXXXXXXXXXXXXXXX",
      "elapsedMs": 120000,
      "note": "第1章読了",
      "refPage": 45
    }
  ]
}
```

**処理:**

1. ユーザーの最新の未保存セッションを取得
2. 関連するLapも一緒に返す

### 3.4 フロントエンド実装方針

#### 3.4.1 状態管理

```typescript
interface TimerState {
  sessionId: string | null; // バックエンドのセッションID
  localStartTime: number | null; // performance.now() の開始時刻
  serverStartTime: string | null; // サーバーから取得した開始時刻
  isRunning: boolean;
  laps: Lap[]; // ローカルで保持
}
```

#### 3.4.2 LocalStorage永続化

```typescript
// LocalStorageにバックアップ
const STORAGE_KEY = "lapnote-timer-state";

const saveToLocalStorage = (state: TimerState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const loadFromLocalStorage = (): TimerState | null => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
};
```

#### 3.4.3 起動時の状態復元

```typescript
useEffect(() => {
  const restoreState = async () => {
    // 1. LocalStorageから復元試行
    const localState = loadFromLocalStorage();

    // 2. バックエンドから最新状態を取得
    const serverState = await api.getCurrentSession();

    // 3. 両者を比較して整合性確認
    if (serverState && localState) {
      if (serverState.sessionId === localState.sessionId) {
        // 同じセッション: Lapをマージ
        setState({
          ...serverState,
          laps: mergeLaps(serverState.laps, localState.laps),
        });
      } else {
        // 異なるセッション: サーバーを優先
        setState(serverState);
      }
    } else if (serverState) {
      setState(serverState);
    } else if (localState) {
      // サーバーにない場合: ローカルを破棄（または復元確認）
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  restoreState();
}, []);
```

#### 3.4.4 時間表示の計算

```typescript
// フロントエンドで表示用の時間計算
const useTimerDisplay = (state: TimerState) => {
  const [displayTime, setDisplayTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!state.isRunning || !state.localStartTime) return;

    const interval = setInterval(() => {
      const elapsedMs = performance.now() - state.localStartTime;
      const totalSec = Math.floor(elapsedMs / 1000);
      setDisplayTime({
        h: Math.floor(totalSec / 3600),
        m: Math.floor((totalSec % 3600) / 60),
        s: totalSec % 60,
      });
    }, 100);

    return () => clearInterval(interval);
  }, [state.isRunning, state.localStartTime]);

  return displayTime;
};
```

#### 3.4.5 Lap追加の戦略

**オプションA: 即座にバックエンド送信**

```typescript
const handleLap = async (note: string, refPage: number) => {
  if (!sessionId || !localStartTime) return;

  const elapsedMs = performance.now() - localStartTime;
  const lap: Lap = { elapsedMs, note, refPage };

  // 1. ローカルに追加
  setLaps([...laps, lap]);
  saveToLocalStorage({ ...state, laps: [...laps, lap] });

  // 2. バックエンドにバックアップ（非同期）
  api.addTimerLap(sessionId, lap).catch((err) => {
    console.error("Failed to backup lap:", err);
    // エラーでもローカルには残っているので続行可能
  });
};
```

**オプションB: バッチ送信（保存時のみ）**

```typescript
const handleLap = (note: string, refPage: number) => {
  if (!localStartTime) return;

  const elapsedMs = performance.now() - localStartTime;
  const lap: Lap = { elapsedMs, note, refPage };

  // ローカルのみに追加
  setLaps([...laps, lap]);
  saveToLocalStorage({ ...state, laps: [...laps, lap] });
};
```

**推奨: オプションA（即座送信）**

- データ損失リスクが低い
- バックエンドで異常検知が可能
- 複数デバイス対応の余地がある

### 3.5 エラーハンドリング

#### 3.5.1 ネットワーク断時の対応

```typescript
const handleStart = async () => {
  try {
    const session = await api.startTimerSession();

    setSessionId(session.id);
    setServerStartTime(session.startTime);
    setLocalStartTime(performance.now());
    setIsRunning(true);

    saveToLocalStorage({ sessionId: session.id, ... });
  } catch (error) {
    // オフライン時: ローカルのみで開始
    const tempSessionId = `offline-${Date.now()}`;
    setSessionId(tempSessionId);
    setLocalStartTime(performance.now());
    setIsRunning(true);

    saveToLocalStorage({ sessionId: tempSessionId, ... });

    // 再接続時にサーバーと同期
    retrySync();
  }
};

const retrySync = async () => {
  // 定期的に再接続を試行し、オフラインセッションをサーバーに登録
  // 実装は複雑になるため、初期バージョンでは「オフライン時は開始不可」も検討
};
```

#### 3.5.2 時刻ズレの検出

```typescript
const handleSave = async () => {
  const clientDuration = Math.floor(
    (performance.now() - localStartTime) / 1000,
  );

  const result = await api.saveTimerSession(sessionId, {
    isbn,
    firstPage,
    lastPage,
    rating,
    laps,
    clientCalculatedDurationSec: clientDuration,
  });

  const serverDuration = result.sessionDurationSec;
  const diff = Math.abs(serverDuration - clientDuration);

  if (diff > 10) {
    // 10秒以上のズレがある場合は警告
    console.warn(`Time discrepancy detected: ${diff}s`);
    // UIで警告表示（オプション）
  }
};
```

---

## 4. 段階的実装計画

### Phase 1: 基本機能（MVP）

**目標:** オフライン非対応、シンプルな実装

**実装内容:**

- `timer_sessions` テーブル作成
- 開始/停止/保存APIの実装
- フロントエンドでの基本的なセッション管理
- LocalStorageによる簡易バックアップ

**実装しない機能:**

- オフライン対応
- Lapのバックエンドバックアップ
- 複数デバイス同期
- 詳細なエラーハンドリング

### Phase 2: 信頼性向上

**目標:** データ損失を防ぐ

**実装内容:**

- `timer_laps` テーブル作成
- Lap追加時のバックエンドバックアップ
- セッション復元機能の強化
- エラーハンドリングの改善

### Phase 3: オフライン対応（将来）

**目標:** ネットワーク断でも利用可能

**実装内容:**

- Service Workerによるオフライン検出
- IndexedDBへの完全な状態保存
- 再接続時の同期ロジック
- コンフリクト解決機能

---

## 5. セキュリティ考慮事項

### 5.1 時間改ざん対策

**問題:**
クライアント送信の時間を盲信すると、改ざん可能

**対策:**

```rust
// バックエンド側で時間を再計算
let server_duration_sec = (stop_time - start_time).as_secs();
let client_duration_sec = request.client_calculated_duration_sec;

// 許容誤差を超える場合は拒否
if (server_duration_sec as i64 - client_duration_sec as i64).abs() > 60 {
    return Err(Error::InvalidDuration);
}

// サーバー計算値を優先して保存
reading_log.session_duration_sec = server_duration_sec;
```

### 5.2 セッション所有者確認

```rust
// 必ず認証ユーザーとセッションの所有者を確認
if session.user_id != authenticated_user.id {
    return Err(Error::Forbidden);
}
```

### 5.3 セッション重複防止

```sql
-- 1ユーザーあたり1つの進行中セッションのみ許可
CREATE UNIQUE INDEX idx_timer_sessions_active
ON timer_sessions(user_id)
WHERE stop_time IS NULL;
```

---

## 6. パフォーマンス考慮事項

### 6.1 D1の書き込み遅延

**問題:**
D1は書き込み後の読み取りに遅延がある（最大1秒）

**対策:**

- セッション作成時にレスポンスでデータを返す（DBから再読み取りしない）
- クライアント側でキャッシュを活用

### 6.2 不要なセッションのクリーンアップ

```sql
-- 定期的に古い保存済みセッションを削除（Cron Triggerで実行）
DELETE FROM timer_sessions
WHERE is_saved = TRUE
  AND updated_at < datetime('now', '-30 days');
```

---

## 7. 提案設計との比較

| 項目                 | 提案設計                     | 推奨設計 (ハイブリッド型)        |
| -------------------- | ---------------------------- | -------------------------------- |
| **時間計算**         | フロントエンドのみ           | フロント表示 + サーバー検証      |
| **Lap保存**          | 最後にまとめて送信           | 即座にバックアップ（オプション） |
| **データ損失リスク** | 高い（ブラウザ閉じると消失） | 低い（LocalStorage + DB）        |
| **セキュリティ**     | 低い（改ざん可能）           | 高い（サーバー検証）             |
| **オフライン対応**   | 可能                         | Phase 3で可能                    |
| **実装複雑度**       | 低                           | 中                               |
| **バックエンド負荷** | 最小                         | 中程度                           |

---

## 8. 結論と推奨事項

### 8.1 推奨設計の採用理由

1. **データ整合性:** サーバー側で時間を記録・検証することで、正確なデータを保証
2. **セキュリティ:** 改ざん対策により、統計データの信頼性を確保
3. **段階的実装:** MVPから開始し、必要に応じて機能拡張可能
4. **柔軟性:** LocalStorageとの併用で、将来のオフライン対応への道筋

### 8.2 提案設計の部分採用

以下の点は提案設計の良い部分として採用:

- **フロントエンドでの時間表示計算:** ネットワーク負荷を減らし、UXを向上
- **Lapのローカル保持:** 即座の反映と編集が可能
- **まとめて保存:** 最終的な保存は1回のAPIコールで完結

### 8.3 実装開始のステップ

1. **Phase 1 (MVP)** の実装から開始
2. バックエンドAPIの設計・実装（2-3日）
3. フロントエンドの状態管理リファクタリング（2-3日）
4. 統合テスト・デバッグ（1-2日）
5. **Phase 2** 以降は必要性に応じて検討

---

## 9. 付録

### 9.1 データフロー図

```
[ユーザー操作]
     │
     ▼
┌────────────────────────────────────────┐
│  1. Start ボタン押下                    │
└────┬───────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│ Frontend: startTimer()                 │
│  - POST /api/timer/sessions            │
│  - sessionId, serverStartTimeを取得    │
│  - localStartTime = performance.now()  │
│  - LocalStorageに保存                  │
└────┬───────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│ Backend: timer_sessions作成            │
│  - start_time = NOW()                  │
│  - sessionId返却                       │
└────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│  2. タイマー表示 (1秒ごと更新)         │
│  - elapsed = performance.now()          │
│              - localStartTime          │
└────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│  3. Lap ボタン押下                     │
└────┬───────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│ Frontend: timerLap()                   │
│  - elapsedMs計算                       │
│  - laps配列に追加                      │
│  - LocalStorageに保存                  │
│  - (オプション) POST .../laps          │
└────┬───────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│ (オプション) Backend: timer_laps作成   │
└────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│  4. Stop ボタン押下                    │
└────┬───────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│ Frontend: stopTimer()                  │
│  - PATCH .../stop                      │
│  - isRunning = false                   │
└────┬───────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│ Backend: timer_sessions更新            │
│  - stop_time = NOW()                   │
│  - duration計算して返却                │
└────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│  5. Save ボタン押下                    │
└────┬───────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│ Frontend: handleSave()                 │
│  - POST .../save                       │
│  - {isbn, pages, rating, laps}         │
└────┬───────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│ Backend: セッション保存                │
│  - 時間の検証                          │
│  - reading_logs作成                    │
│  - laps作成                            │
│  - is_saved = true                     │
└────┬───────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│  6. LocalStorageクリア                 │
│  - リセット完了                        │
└────────────────────────────────────────┘
```

### 9.2 既存コードへの影響範囲

**変更が必要なファイル:**

1. **Backend:**
   - `apps/backend-web/src/db/schema.sql` - 新規テーブル追加
   - `apps/backend-web/src/handlers/mod.rs` - timer モジュール追加
   - `apps/backend-web/src/handlers/timer.rs` - 新規作成
   - `apps/backend-web/src/lib.rs` - ルート追加
   - `apps/backend-web/src/models.rs` - TimerSession, TimerLap構造体追加

2. **Frontend:**
   - `frontend/src/utils/api-web.ts` - Timer API実装
   - `frontend/src/hooks/useLapnoteTimer.ts` - ロジック変更
   - `frontend/src/types/index.d.ts` - TimerSession型追加

3. **Core (オプション):**
   - `packages/core/src/domain/mod.rs` - TimerSession, TimerLap追加
   - `packages/core/src/ports/mod.rs` - Timer関連trait追加

### 9.3 テストケース例

```typescript
describe('LapnoteTimer Web Version', () => {
  it('セッション開始でバックエンドにセッションが作成される', async () => {
    const { sessionId } = await api.startTimerSession();
    expect(sessionId).toBeDefined();
  });

  it('LocalStorageに状態が保存される', async () => {
    await startTimer();
    const saved = localStorage.getItem('lapnote-timer-state');
    expect(saved).toBeDefined();
  });

  it('ページリロード後に状態が復元される', async () => {
    // セッション開始
    await startTimer();
    const beforeSessionId = getSessionId();

    // ページリロードをシミュレート
    window.location.reload();

    // 復元確認
    await waitForRestore();
    const afterSessionId = getSessionId();
    expect(afterSessionId).toBe(beforeSessionId);
  });

  it('保存時にサーバー計算時間とクライアント計算時間が近い', async () => {
    await startTimer();
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒待機
    const result = await saveSession({ ... });

    const clientDuration = 5;
    const serverDuration = result.sessionDurationSec;
    expect(Math.abs(serverDuration - clientDuration)).toBeLessThan(2);
  });
});
```

---

## 10. まとめ

提案された「チケット方式」は、バックエンドの負荷を最小化する点で優れていますが、データ整合性、セキュリティ、信頼性の観点で課題があります。

本仕様書で提案する**ハイブリッド型セッション管理**は、以下を実現します:

✅ **データの正確性**: サーバー側で時間を記録・検証  
✅ **データ損失防止**: LocalStorage + バックエンドの二重保存  
✅ **セキュリティ**: 改ざん対策と所有者確認  
✅ **UX**: フロントエンドでの即座な時間表示  
✅ **段階的実装**: MVPから開始し、必要に応じて拡張可能

この設計により、Web版でもTauri版と同等の信頼性を持つLapnoteTimer機能を提供できます。

