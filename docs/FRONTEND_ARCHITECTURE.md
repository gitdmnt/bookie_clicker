# Frontend Architecture

## 概要

Bookie Clicker のフロントエンドは React + TypeScript + Vite で構成され、Tauri（デスクトップ）と Web（Cloudflare Workers）の両環境で動作する読書管理アプリケーションです。

## ディレクトリ構成

```
frontend/src/
├── App.tsx              # ルーティング定義
├── main.tsx             # エントリーポイント
├── types/index.d.ts     # グローバル型定義
├── contexts/
│   └── AuthContext.tsx   # 認証コンテキスト (Google OAuth + PKCE)
├── hooks/
│   ├── useLapnoteTimer.ts  # ラップノートタイマーのカスタムフック
│   ├── useLoadBooks.ts     # 書籍一覧読み込みフック
│   └── useReadingLogs.ts   # 読書ログ読み込みフック
├── utils/
│   ├── api.ts           # 統合APIファサード（環境自動選択）
│   ├── api-web.ts       # Web版API実装
│   ├── api-tauri.ts     # Tauri版API実装
│   ├── env-detect.ts    # 環境検出ユーティリティ
│   └── isbn.ts          # ISBNバリデーション・変換
├── pages/
│   ├── Login.tsx         # ログインページ
│   ├── AuthCallback.tsx  # OAuth コールバック
│   ├── lapnote/          # ラップノートページ（タイマー + メモ）
│   ├── bookshelf/        # 本棚ページ（書籍管理）
│   ├── logbook/          # 読書記録ページ（統計付き）
│   └── stats/            # 全体統計ページ
└── components/
    ├── ProtectedRoute.tsx  # 認証ガード
    ├── MenuBar/            # ナビゲーションバー
    ├── ui/                 # 共通UIコンポーネント
    ├── statistics/         # 統計グラフコンポーネント
    └── stats/              # ActivityHeatmap等
```

## 主要モジュール

### utils/ — ユーティリティ・純粋関数

| モジュール      | 責務                                                |
| --------------- | --------------------------------------------------- |
| `isbn.ts`       | ISBN-10/13 のバリデーション・正規化・変換           |
| `env-detect.ts` | Tauri/Web 環境の判定                                |
| `api.ts`        | 環境に応じた API 実装の自動選択ファサード           |
| `api-web.ts`    | Web 版 fetch ベース API + LocalStorage タイマー管理 |
| `api-tauri.ts`  | Tauri invoke ベース API                             |

### pages/lapnote/utils.ts — タイマー表示ユーティリティ

| 関数            | 責務                                   |
| --------------- | -------------------------------------- |
| `msToTime`      | ミリ秒 → StopwatchTime 変換            |
| `formatTime`    | StopwatchTime → "HH:MM:SS" 文字列      |
| `formatElapsed` | ミリ秒 → "HH:MM:SS" 文字列（合成関数） |

### pages/logbook/utils.ts — 読書記録ユーティリティ

| 関数                           | 責務                                   |
| ------------------------------ | -------------------------------------- |
| `formatTime`                   | 秒 → "M:SS" 文字列                     |
| `formatDateTime`               | PlainDateTime → 日本語日付文字列       |
| `formatReadingTime`            | 秒 → "Xh Ym" 文字列                    |
| `getHeatmapColor`              | アクティビティ数 → TailwindCSS色クラス |
| `generateActivityData`         | 読書ログ → 365日分アクティビティデータ |
| `groupByWeeks`                 | アクティビティデータ → 週グリッド      |
| `sortLaps`                     | ラップ配列ソート（日付順/ページ順）    |
| `generateReadingPaceData`      | 読書ログ → 週別ページ数データ          |
| `generateSessionFrequencyData` | 読書ログ → 月別セッション数データ      |

### pages/stats/utils.ts — 全体統計ユーティリティ

| 関数                            | 責務                        |
| ------------------------------- | --------------------------- |
| `calculateCompletedBooks`       | 完読書籍数の計算            |
| `findLongestSession`            | 最長セッションの特定        |
| `calculateRecentActivity`       | 直近N日間のアクティビティ数 |
| `calculateAverageReadingSpeed`  | 平均読書速度（分/ページ）   |
| `calculateConsistencyScore`     | 読書一貫性スコア（0-100）   |
| `generateMonthlyTrend`          | 月別読書トレンドデータ生成  |
| `calculateTimeSlotDistribution` | 時間帯別読書分布            |

### utils/pkce.ts — PKCE ヘルパー（AuthContext から抽出）

| 関数                    | 責務                                          |
| ----------------------- | --------------------------------------------- |
| `base64UrlEncode`       | ArrayBuffer → Base64URL 文字列変換            |
| `generateCodeVerifier`  | PKCE code_verifier ランダム生成               |
| `generateCodeChallenge` | code_verifier → SHA-256 → code_challenge 生成 |

### utils/stats-helpers.ts — 統計・計算の純粋関数（各コンポーネントから抽出）

| 関数                           | 抽出元           | 責務                                        |
| ------------------------------ | ---------------- | ------------------------------------------- |
| `calculateTotalReadingTimeSec` | TotalReadingTime | 読書ログの合計読書時間（秒）                |
| `calculateTotalPages`          | TotalPages       | 読書ログの合計ページ数                      |
| `calculateTotalMemos`          | TotalMemos       | ラップのメモ総数                            |
| `formatSecondsToHM`            | TotalReadingTime | 秒 → "Xh Ym" 文字列                         |
| `calculateStreak`              | StreakDays       | 連続読書日数（オプション today パラメータ） |
| `calculateAverageReadingSpeed` | AverageSpeed     | 平均読書速度（分/ページ）                   |
| `calculateBookStats`           | TopBooksRanking  | 本別統計集計                                |
| `getTopBooksByReadingTime`     | TopBooksRanking  | 読書時間上位N冊取得                         |
| `computeFirstPage`             | useLapnoteTimer  | ラップ一覧から開始ページ計算                |
| `computeLastPage`              | useLapnoteTimer  | ラップ一覧から終了ページ計算                |
| `stopwatchTimeToSeconds`       | useLapnoteTimer  | StopwatchTime → 秒変換                      |
| `secondsToStopwatchTime`       | —                | 秒 → StopwatchTime 変換                     |
| `filterBooks`                  | Bookshelf        | 検索語による書籍フィルタリング              |
| `calculateLogbookStatistics`   | Logbook          | 読書記録の統計値計算                        |
| `generateTopSessions`          | Logbook          | 読書時間上位セッション取得                  |

### contexts/AuthContext.tsx — 認証

| 関数                | 責務                   |
| ------------------- | ---------------------- |
| `getSessionToken`   | セッショントークン取得 |
| `clearSessionToken` | セッショントークン削除 |
| `fetchWithAuth`     | 認証付きfetchラッパー  |

### pages/stats/ — 統計コンポーネント

| コンポーネント          | 利用する純粋関数                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `TotalFinishedBooks`    | `isFinished` — ページ範囲マージによる読了判定（コンポーネント内）                                        |
| `StreakDays`            | `calculateStreak` — stats-helpers.ts                                                                     |
| `AverageSpeed`          | `calculateAverageReadingSpeed`, `calculateTotalPages`, `calculateTotalReadingTimeSec` — stats-helpers.ts |
| `TotalReadingTime`      | `calculateTotalReadingTimeSec`, `formatSecondsToHM` — stats-helpers.ts                                   |
| `TotalPages`            | `calculateTotalPages` — stats-helpers.ts                                                                 |
| `TotalMemos`            | `calculateTotalMemos` — stats-helpers.ts                                                                 |
| `TopBooksRanking`       | `calculateBookStats`, `getTopBooksByReadingTime`, `formatSecondsToHM` — stats-helpers.ts                 |
| `CumulativeChart/utils` | `generateCumulativeData` — コンポーネント内ユーティリティ                                                |

## テスト方針

- **ユーティリティ関数**: 純粋関数として個別にユニットテスト
- **カスタムフック**: ロジック部分を純粋関数として抽出しテスト
- **コンポーネント内ロジック**: コンポーネントからロジックを分離しテスト
- **結合テスト**: APIモック（`vi.hoisted()` + `vi.mock()`）+ コンポーネントレンダリング

## テスト環境

- **テストランナー**: Vitest 4.0.x
- **DOM環境**: happy-dom
- **UIテスト**: @testing-library/react + @testing-library/user-event
- **パッケージマネージャー**: bun
- **グローバル設定**: `globals: true`（describe/it/expect の自動インポート）

## テストカバレッジ一覧

| テストファイル                                             | テスト数 | 種別           | 対象                       |
| ---------------------------------------------------------- | -------- | -------------- | -------------------------- |
| `utils/__tests__/stats-helpers.test.ts`                    | 44       | ユニット       | 統計・計算の純粋関数       |
| `utils/__tests__/pkce.test.ts`                             | 11       | ユニット       | PKCE ヘルパー              |
| `utils/__tests__/isbn.test.ts`                             | 13       | ユニット       | ISBN バリデーション・変換  |
| `utils/__tests__/env-detect.test.ts`                       | 2        | ユニット       | 環境検出                   |
| `utils/__tests__/api-web-timer.test.ts`                    | 22       | ユニット       | Web版タイマーAPI           |
| `pages/lapnote/__tests__/utils.test.ts`                    | 12       | モジュール     | ラップノートユーティリティ |
| `pages/logbook/__tests__/utils.test.ts`                    | 25       | モジュール     | 読書記録ユーティリティ     |
| `pages/stats/__tests__/utils.test.ts`                      | 15       | モジュール     | 統計ユーティリティ         |
| `pages/stats/CumulativeChart/__tests__/utils.test.ts`      | 3        | モジュール     | 累積チャートユーティリティ |
| `hooks/__tests__/useLapnoteTimer.test.ts`                  | 14       | フック         | タイマーフック             |
| `pages/stats/statsTotal/TotalFinishedBooks.test.ts`        | 11       | コンポーネント | 完読冊数                   |
| `components/stats/ActivityHeatmap/AH.test.ts`              | 1        | コンポーネント | ヒートマップ               |
| `__tests__/auth-flow.integration.test.tsx`                 | 5        | 結合           | 認証フロー                 |
| `pages/bookshelf/__tests__/Bookshelf.integration.test.tsx` | 2        | 結合           | 本棚ページ                 |
| `pages/logbook/__tests__/Logbook.integration.test.tsx`     | 3        | 結合           | 読書記録ページ             |
| `pages/lapnote/__tests__/Lapnote.integration.test.tsx`     | 2        | 結合           | ラップノートページ         |
| **合計**                                                   | **185**  |                |                            |

## リファクタリング履歴

### 関数の抽出（2025-07）

以下のコンポーネント・フックからインライン計算ロジックを `utils/stats-helpers.ts` へ抽出：

- **StreakDays** → `calculateStreak`
- **AverageSpeed** → `calculateAverageReadingSpeed`
- **TotalReadingTime** → `calculateTotalReadingTimeSec`, `formatSecondsToHM`
- **TotalPages** → `calculateTotalPages`
- **TotalMemos** → `calculateTotalMemos`
- **TopBooksRanking** → `calculateBookStats`, `getTopBooksByReadingTime`
- **useLapnoteTimer** → `computeFirstPage`, `computeLastPage`, `stopwatchTimeToSeconds`
- **Bookshelf** → `filterBooks`
- **Logbook** → `calculateLogbookStatistics`, `generateTopSessions`

AuthContext.tsx から PKCE 関連関数を `utils/pkce.ts` へ抽出：

- `base64UrlEncode`, `generateCodeVerifier`, `generateCodeChallenge`

