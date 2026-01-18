import Card from "@/components/ui/Card";

interface AnnotatedRangeCardProps {
  laps: Lap[];
}

/**
 * 最もメモを取ったページ範囲を取得
 */
const findMostAnnotatedPageRange = (laps: Lap[]): string => {
  if (laps.length === 0) return "-";

  const lapsWithMemo = laps.filter(
    (lap) => lap.note && lap.note.trim().length > 0,
  );
  if (lapsWithMemo.length === 0) return "-";

  // ページを10ページ単位でグループ化
  const pageGroups = new Map<number, number>();

  lapsWithMemo.forEach((lap) => {
    const groupStart = Math.floor(lap.refPage / 10) * 10;
    pageGroups.set(groupStart, (pageGroups.get(groupStart) || 0) + 1);
  });

  let maxGroup = 0;
  let maxCount = 0;

  pageGroups.forEach((count, group) => {
    if (count > maxCount) {
      maxCount = count;
      maxGroup = group;
    }
  });

  return `p.${maxGroup}-${maxGroup + 9}`;
};

export const AnnotatedRangeCard = ({ laps }: AnnotatedRangeCardProps) => {
  const annotatedRange = findMostAnnotatedPageRange(laps);

  return (
    <Card variant="default">
      <div className="text-center">
        <div className="text-2xl font-black text-nb-blue mb-1">
          {annotatedRange}
        </div>
        <div className="text-xs font-bold text-gray-600">最多メモ範囲</div>
      </div>
    </Card>
  );
};
