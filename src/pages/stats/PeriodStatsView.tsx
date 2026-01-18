import { useState, useMemo } from "react";
import { Temporal } from "temporal-polyfill";
import { motion } from "framer-motion";

type PeriodType = "weekly" | "monthly" | "yearly";

interface PeriodStats {
  period: string;
  sessions: number;
  time: number;
  pages: number;
  memos: number;
  cumulativeSessions: number;
  cumulativeTime: number;
  cumulativePages: number;
  cumulativeMemos: number;
}

interface PeriodStatsViewProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

export const PeriodStatsView = ({ logs }: PeriodStatsViewProps) => {
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [showCumulative, setShowCumulative] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 期間でフィルタリングされたログ
  const filteredLogs = useMemo(() => {
    if (!startDate && !endDate) return logs;

    return logs.filter(({ readingLog }) => {
      const logDate = Temporal.PlainDate.from(readingLog.createdAt.toString());

      if (startDate) {
        const start = Temporal.PlainDate.from(startDate);
        if (Temporal.PlainDate.compare(logDate, start) < 0) return false;
      }

      if (endDate) {
        const end = Temporal.PlainDate.from(endDate);
        if (Temporal.PlainDate.compare(logDate, end) > 0) return false;
      }

      return true;
    });
  }, [logs, startDate, endDate]);

  const periodStats = useMemo(() => {
    if (filteredLogs.length === 0) return [];

    const statsMap = new Map<string, Omit<PeriodStats, "period">>();

    filteredLogs.forEach(({ readingLog, laps }) => {
      const date = Temporal.PlainDate.from(readingLog.createdAt.toString());
      let periodKey: string;

      if (periodType === "weekly") {
        const weekNumber = Math.ceil(date.dayOfYear / 7);
        periodKey = `${date.year}年W${weekNumber}`;
      } else if (periodType === "monthly") {
        periodKey = `${date.year}年${date.month}月`;
      } else {
        periodKey = `${date.year}年`;
      }

      const existing = statsMap.get(periodKey) || {
        sessions: 0,
        time: 0,
        pages: 0,
        memos: 0,
        cumulativeSessions: 0,
        cumulativeTime: 0,
        cumulativePages: 0,
        cumulativeMemos: 0,
      };

      const memoCount = laps.filter(
        (lap) => lap.note && lap.note.trim().length > 0,
      ).length;

      statsMap.set(periodKey, {
        sessions: existing.sessions + 1,
        time: existing.time + readingLog.sessionDurationSec,
        pages: existing.pages + (readingLog.page[1] - readingLog.page[0]),
        memos: existing.memos + memoCount,
        cumulativeSessions: 0,
        cumulativeTime: 0,
        cumulativePages: 0,
        cumulativeMemos: 0,
      });
    });

    // 期間順にソートして累積値を計算
    const sortedStats: PeriodStats[] = Array.from(statsMap.entries())
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));

    let cumSessions = 0;
    let cumTime = 0;
    let cumPages = 0;
    let cumMemos = 0;

    sortedStats.forEach((stat) => {
      cumSessions += stat.sessions;
      cumTime += stat.time;
      cumPages += stat.pages;
      cumMemos += stat.memos;

      stat.cumulativeSessions = cumSessions;
      stat.cumulativeTime = cumTime;
      stat.cumulativePages = cumPages;
      stat.cumulativeMemos = cumMemos;
    });

    return sortedStats.slice(-12); // 最新12期間を表示
  }, [filteredLogs, periodType]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const maxValue = useMemo(() => {
    if (periodStats.length === 0) return 1;
    if (showCumulative) {
      return Math.max(
        ...periodStats.map((s) => s.cumulativeSessions),
        ...periodStats.map((s) => s.cumulativePages / 10),
        1,
      );
    }
    return Math.max(
      ...periodStats.map((s) => s.sessions),
      ...periodStats.map((s) => s.pages / 10),
      1,
    );
  }, [periodStats, showCumulative]);

  // プリセット期間設定
  const setPresetPeriod = (
    preset: "7days" | "30days" | "3months" | "1year" | "all",
  ) => {
    const today = Temporal.Now.plainDateISO();

    switch (preset) {
      case "7days":
        setStartDate(today.subtract({ days: 7 }).toString());
        setEndDate(today.toString());
        break;
      case "30days":
        setStartDate(today.subtract({ days: 30 }).toString());
        setEndDate(today.toString());
        break;
      case "3months":
        setStartDate(today.subtract({ months: 3 }).toString());
        setEndDate(today.toString());
        break;
      case "1year":
        setStartDate(today.subtract({ years: 1 }).toString());
        setEndDate(today.toString());
        break;
      case "all":
        setStartDate("");
        setEndDate("");
        break;
    }
  };

  return (
    <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-black">📊 期間別統計</h2>

        <div className="flex items-center gap-3 flex-wrap">
          {/* 期間指定ボタン */}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-4 py-2 text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none bg-nb-yellow text-black"
          >
            📅 期間指定
          </button>

          {/* 推移/累積切り替え */}
          <button
            onClick={() => setShowCumulative(!showCumulative)}
            className={`px-4 py-2 text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
              showCumulative ? "bg-nb-purple text-white" : "bg-white text-black"
            }`}
          >
            {showCumulative ? "📈 累積" : "📊 推移"}
          </button>

          {/* 期間選択 */}
          <div className="flex gap-2">
            {(["weekly", "monthly", "yearly"] as PeriodType[]).map((type) => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`px-3 py-2 text-xs font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
                  periodType === type
                    ? "bg-nb-pink-400 text-white"
                    : "bg-white text-black"
                }`}
              >
                {type === "weekly"
                  ? "週別"
                  : type === "monthly"
                    ? "月別"
                    : "年別"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 期間指定パネル */}
      {showDatePicker && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 rounded-lg border-2 border-black bg-nb-yellow bg-opacity-20"
        >
          <div className="space-y-4">
            {/* プリセット期間 */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-2 block">
                プリセット期間
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "過去7日", value: "7days" as const },
                  { label: "過去30日", value: "30days" as const },
                  { label: "過去3ヶ月", value: "3months" as const },
                  { label: "過去1年", value: "1year" as const },
                  { label: "全期間", value: "all" as const },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setPresetPeriod(preset.value)}
                    className="px-3 py-1 text-xs font-bold rounded border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* カスタム期間 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block">
                  開始日
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded border-2 border-black font-semibold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-nb-pink-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block">
                  終了日
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded border-2 border-black font-semibold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-nb-pink-400"
                />
              </div>
            </div>

            {/* 選択中の期間表示 */}
            {(startDate || endDate) && (
              <div className="flex items-center justify-between p-3 bg-white rounded border-2 border-black">
                <span className="text-sm font-bold text-gray-700">
                  選択期間: {startDate || "開始"} 〜 {endDate || "終了"}
                </span>
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="px-3 py-1 text-xs font-bold rounded border-2 border-black bg-nb-pink-400 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  クリア
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {periodStats.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <div className="font-semibold">データがありません</div>
        </div>
      ) : (
        <>
          {/* グラフ */}
          <div className="mb-6 space-y-3">
            {periodStats.map((stat, index) => (
              <motion.div
                key={stat.period}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700 min-w-[100px]">
                    {stat.period}
                  </span>
                  <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                    <span>
                      {showCumulative ? stat.cumulativeSessions : stat.sessions}
                      セッション
                    </span>
                    <span>
                      {formatTime(
                        showCumulative ? stat.cumulativeTime : stat.time,
                      )}
                    </span>
                    <span>
                      {showCumulative ? stat.cumulativePages : stat.pages}
                      ページ
                    </span>
                    <span>
                      📝
                      {showCumulative ? stat.cumulativeMemos : stat.memos}
                    </span>
                  </div>
                </div>

                <div className="relative h-10 bg-gray-100 rounded border-2 border-black overflow-hidden">
                  {/* セッション数バー */}
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-nb-blue opacity-70"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((showCumulative ? stat.cumulativeSessions : stat.sessions) / maxValue) * 100}%`,
                    }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  />
                  {/* ページ数バー */}
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-nb-pink-400 opacity-50"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((showCumulative ? stat.cumulativePages : stat.pages) / 10 / maxValue) * 100}%`,
                    }}
                    transition={{ duration: 0.5, delay: index * 0.05 + 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* 凡例 */}
          <div className="flex items-center justify-center gap-6 text-xs font-semibold text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-nb-blue opacity-70 rounded border border-black" />
              <span>セッション数</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-nb-pink-400 opacity-50 rounded border border-black" />
              <span>ページ数 (×0.1)</span>
            </div>
          </div>

          {/* サマリー */}
          {showCumulative && periodStats.length > 0 && (
            <div className="mt-6 pt-4 border-t-2 border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-nb-blue bg-opacity-10 rounded border-2 border-black">
                  <div className="text-2xl font-black text-nb-blue">
                    {periodStats[periodStats.length - 1].cumulativeSessions}
                  </div>
                  <div className="text-xs font-bold text-gray-600 mt-1">
                    累積セッション
                  </div>
                </div>
                <div className="text-center p-3 bg-nb-purple bg-opacity-10 rounded border-2 border-black">
                  <div className="text-2xl font-black text-nb-purple">
                    {formatTime(
                      periodStats[periodStats.length - 1].cumulativeTime,
                    )}
                  </div>
                  <div className="text-xs font-bold text-gray-600 mt-1">
                    累積時間
                  </div>
                </div>
                <div className="text-center p-3 bg-nb-pink-400 bg-opacity-10 rounded border-2 border-black">
                  <div className="text-2xl font-black text-nb-pink-500">
                    {periodStats[periodStats.length - 1].cumulativePages}
                  </div>
                  <div className="text-xs font-bold text-gray-600 mt-1">
                    累積ページ
                  </div>
                </div>
                <div className="text-center p-3 bg-nb-yellow bg-opacity-10 rounded border-2 border-black">
                  <div className="text-2xl font-black text-nb-orange">
                    📝 {periodStats[periodStats.length - 1].cumulativeMemos}
                  </div>
                  <div className="text-xs font-bold text-gray-600 mt-1">
                    累積メモ
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
