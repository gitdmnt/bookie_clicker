import Card from "@/components/ui/Card";

interface FocusScoreCardProps {
  laps: Lap[];
}

/**
 * 集中度スコアを計算（ラップあたりの平均時間から算出）
 */
const calculateFocusScore = (laps: Lap[]): number => {
  if (laps.length === 0) return 0;

  const avgTime =
    laps.reduce((sum, lap) => sum + lap.elapsedMs, 0) / laps.length / 1000;

  // 2分以上を高集中、1分以下を低集中として0-100のスコアに変換
  const score = Math.min(100, Math.max(0, (avgTime / 120) * 100));
  return Math.round(score);
};

export const FocusScoreCard = ({ laps }: FocusScoreCardProps) => {
  const focusScore = calculateFocusScore(laps);

  return (
    <Card variant="default">
      <div className="text-center">
        <div className="text-3xl font-black text-nb-purple mb-1">
          {focusScore}
        </div>
        <div className="text-xs font-bold text-gray-600">集中度スコア</div>
      </div>
    </Card>
  );
};
