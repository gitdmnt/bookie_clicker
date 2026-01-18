import { Temporal } from "temporal-polyfill";

interface ActivityData {
  date: string;
  dur: number;
}

const getHeatmapColor = (minutes: number): string => {
  if (minutes === 0) return "bg-gray-100";
  if (minutes <= 60) return "bg-nb-pink-200";
  if (minutes <= 120) return "bg-nb-pink-300";
  if (minutes <= 180) return "bg-nb-pink-400";
  return "bg-nb-pink-500";
};

export const generateActivityData = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): ActivityData[] => {
  const today = Temporal.Now.plainDateISO();
  const oneYearAgo = today.subtract({ days: 364 });

  // 日付ごとの読書時間を集計
  const activityMap = new Map<string, number>();

  logs.forEach(({ readingLog }) => {
    const date = Temporal.PlainDate.from(readingLog.createdAt.toString());
    const dateStr = date.toString();
    const sessionDuration = readingLog.sessionDurationSec;
    activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + sessionDuration);
  });

  // 過去365日分のデータを生成
  const days: { date: string; dur: number }[] = [];
  for (let i = 0; i < 365; i++) {
    const date = oneYearAgo.add({ days: i });
    const dateStr = date.toString();
    days.push({
      date: dateStr,
      dur: (activityMap.get(dateStr) || 0) / 60, // 分単位に変換
    });
  }

  return days;
};

const groupByWeeks = (
  activityData: ActivityData[],
): (ActivityData | { date: string; dur: undefined })[][] => {
  const result: { date: string; dur: number | undefined }[][] = [];
  let currentWeek: { date: string; dur: number | undefined }[] = [];

  if (activityData.length === 0) return result;

  // 最初の週の開始曜日を調整
  const firstDay = activityData[0];
  const firstDate = Temporal.PlainDate.from(firstDay.date);
  const dayOfWeek = firstDate.dayOfWeek; // 1 (Monday) to 7 (Sunday)

  // 最初の週を埋める
  for (let i = 1; i < dayOfWeek; i++) {
    currentWeek.push({ date: firstDay.date, dur: undefined }); // undefined は空セル
  }

  activityData.forEach((day) => {
    currentWeek.push(day);

    if (currentWeek.length === 7) {
      result.push(currentWeek);
      currentWeek = [];
    }
  });

  // 最後の週を埋める
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({
        date: activityData[activityData.length - 1].date,
        dur: undefined,
      });
    }
    result.push(currentWeek);
  }

  return result;
};

// アクティビティヒートマップ用データ

export const ActivityHeatmap = ({
  allLogs,
}: {
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const activityData = generateActivityData(allLogs);
  const weeks = groupByWeeks(activityData);

  const days = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="flex flex-col gap-3 rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <h2 className="text-xl font-black text-black">📅 読書活動ヒートマップ</h2>

      <div className="overflow-y-hidden">
        <div className="flex gap-1 justify-start items-start">
          <div className="flex flex-col gap-1">
            {days.map((day, i) => (
              <div
                key={i}
                className="h-3 text-[10px] font-bold text-gray-600 flex items-center"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="flex flex-row gap-1 overflow-x-scroll">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) =>
                  day.dur !== undefined ? (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm border border-gray-300 ${getHeatmapColor(
                        day.dur,
                      )}`}
                      title={`${day.date}: ${day.dur}分`}
                    />
                  ) : (
                    <div key={dayIndex} className="w-3 h-3" />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
        <span>少</span>
        <div className="flex gap-1">
          {[0, 60, 120, 180, 240].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm border border-gray-300 ${getHeatmapColor(level)}`}
            />
          ))}
        </div>
        <span>多</span>
      </div>
    </div>
  );
};

export type { ActivityData };
