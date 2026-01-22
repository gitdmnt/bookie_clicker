interface TopSession {
  date: string;
  duration: number;
  pages: number;
}

interface TopSessionsRankingProps {
  topSessions: TopSession[];
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export const TopSessionsRanking = ({
  topSessions,
}: TopSessionsRankingProps) => {
  if (topSessions.length === 0) {
    return null;
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <h2 className="text-xl font-black text-black mb-4">
        🏆 最長セッション TOP5
      </h2>

      <div className="space-y-3">
        {topSessions.map((session, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg border-2 border-black bg-nb-yellow bg-opacity-30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="text-2xl flex-shrink-0">
              {index < 3 ? medals[index] : `${index + 1}`}
            </div>
            <div className="flex-1">
              <div className="text-lg font-black text-nb-purple">
                {formatTime(session.duration)}
              </div>
              <div className="text-xs font-semibold text-gray-600">
                {session.date} • {session.pages}ページ
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export type { TopSession };
