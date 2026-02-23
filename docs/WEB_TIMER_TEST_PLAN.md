# Web版 LapnoteTimer ユニットテスト計画

## 1. テスト対象モジュール一覧

今回の実装で追加・変更された全モジュールを対象とする。

### 1.1 バックエンド (Rust / Cloudflare Workers)

| モジュール          | ファイル                                 | テスト可能範囲                                                 |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| **models**          | `apps/backend-web/src/models.rs`         | `TimerSession` の Serialize/Deserialize, `Session::is_expired` |
| **handlers::timer** | `apps/backend-web/src/handlers/timer.rs` | `compute_duration` ヘルパー関数                                |

> **注意**: `d1_adapter.rs` のDB操作は D1 (Cloudflare) に依存するため、純粋なユニットテストは困難。
> ハンドラー関数も `Request`/`RouteContext` に依存するため、テスト対象はユーティリティ関数に限定する。

### 1.2 フロントエンド (TypeScript / Vitest)

| モジュール          | ファイル                                | テスト可能範囲                                        |
| ------------------- | --------------------------------------- | ----------------------------------------------------- |
| **api-web (timer)** | `frontend/src/utils/api-web.ts`         | LocalStorage状態管理、経過時間計算、Lap管理、tick生成 |
| **useLapnoteTimer** | `frontend/src/hooks/useLapnoteTimer.ts` | React Hook の動作（start/stop/lap/reset/save フロー） |

---

## 2. バックエンドテスト設計

### 2.1 `models.rs` — TimerSession

| テストケース                   | 内容                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| `timer_session_serialize`      | TimerSession が正しく JSON にシリアライズされる（camelCase） |
| `timer_session_deserialize`    | JSON から TimerSession に正しくデシリアライズされる          |
| `timer_session_stop_time_none` | stop_time が null の場合に正しくデシリアライズされる         |
| `session_is_expired_true`      | 過去の expires_at で `is_expired()` が true を返す           |
| `session_is_expired_false`     | 未来の expires_at で `is_expired()` が false を返す          |
| `session_is_expired_invalid`   | 不正なフォーマットで `is_expired()` が true を返す           |

### 2.2 `handlers/timer.rs` — compute_duration

| テストケース                 | 内容                                             |
| ---------------------------- | ------------------------------------------------ |
| `duration_with_stop_time`    | start と stop が両方ある場合、正しい秒数を返す   |
| `duration_without_stop_time` | stop_time が None の場合、現在時刻までの差を返す |
| `duration_negative_clamped`  | stop < start の場合に 0 を返す（max(0)）         |
| `duration_invalid_start`     | 不正な start_time で 0 を返す                    |
| `duration_same_time`         | start == stop の場合に 0 を返す                  |

---

## 3. フロントエンドテスト設計

### 3.1 `api-web.ts` — Timer LocalStorage 操作

fetch はモックし、LocalStorage は happy-dom の実装を利用する。

| テストケース                         | 内容                                          |
| ------------------------------------ | --------------------------------------------- |
| `loadTimerState_empty`               | LocalStorage が空の場合にデフォルト状態を返す |
| `loadTimerState_saved`               | 保存された状態を正しく読み込む                |
| `loadTimerState_corrupt`             | 破損した JSON でデフォルトにフォールバック    |
| `saveTimerState`                     | 状態が正しく JSON で保存される                |
| `clearTimerState`                    | localStorage から状態が削除される             |
| `computeElapsedMs_running`           | isRunning 時に accumulatedMs + 経過分を返す   |
| `computeElapsedMs_stopped`           | 停止時に accumulatedMs のみを返す             |
| `computeElapsedMs_negative_clamped`  | 負の値は 0 にクランプされる                   |
| `startTimer_new_session`             | 新規セッション作成時に状態が正しく保存される  |
| `startTimer_resume_stopped`          | 停止中のセッションを再開する                  |
| `startTimer_already_running`         | 既に実行中の場合は何もしない                  |
| `stopTimer_accumulates`              | 停止時に経過時間が accumulatedMs に加算される |
| `stopTimer_no_session`               | セッションがない場合は何もしない              |
| `resetTimer_clears`                  | リセット時に状態がクリアされる                |
| `getTimer_returns_time`              | 現在の経過時間を h/m/s で返す                 |
| `timerLap_adds_lap`                  | Lap が追加され状態に保存される                |
| `timerLap_elapsed_correct`           | Lap の elapsedMs が正しい値を持つ             |
| `getTimerLaps_returns_laps`          | 保存されたLapリストを返す                     |
| `saveTimerSession_sends_and_clears`  | 保存成功時に状態がクリアされる                |
| `saveTimerSession_no_session_throws` | セッションがない場合エラーを投げる            |

### 3.2 `useLapnoteTimer.ts` — React Hook

renderHook (vitest + @testing-library/react) でテスト。
api モジュール全体をモックする。

| テストケース                            | 内容                                                     |
| --------------------------------------- | -------------------------------------------------------- |
| `initial_state`                         | 初期状態が正しい（isRunning=false, time=0:0:0, laps=[]） |
| `handleStart_sets_running`              | handleStart 後に isRunning が true になる                |
| `handleStop_sets_not_running`           | handleStop 後に isRunning が false になる                |
| `handleLap_adds_to_laps`                | handleLap 後にラップが追加される                         |
| `handleLap_updates_firstPage`           | ラップのページからfirstPageが自動更新される              |
| `handleLap_updates_lastPage`            | ラップのページからlastPageが自動更新される               |
| `handleReset_clears_state`              | handleReset 後に全ステートがリセットされる               |
| `handleSave_web_calls_saveTimerSession` | Web環境で saveTimerSession が呼ばれる                    |
| `handleSave_tauri_calls_addLaps`        | Tauri環境で addLaps が呼ばれる                           |
| `handleSave_null_book_noop`             | book が null の場合何もしない                            |
| `handleFirstPageChange_sets_flag`       | 手動変更で isFPUpdatedByUser フラグが立つ                |
| `handleLastPageChange_sets_flag`        | 手動変更で isLPUpdatedByUser フラグが立つ                |

---

## 4. テストファイル配置

```
frontend/src/
  utils/
    __tests__/
      api-web-timer.test.ts       ← api-web.ts Timer操作のテスト
  hooks/
    __tests__/
      useLapnoteTimer.test.ts     ← Hook のテスト

apps/backend-web/src/
  models.rs                       ← #[cfg(test)] mod tests 追加
  handlers/
    timer.rs                      ← #[cfg(test)] mod tests 追加
```

---

## 5. テストの実行方法

### フロントエンド

```bash
cd frontend && npx vitest run
```

### バックエンド

```bash
cd apps/backend-web && cargo test
```

