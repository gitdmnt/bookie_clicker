import Card from "@/components/ui/Card";

interface TotalSessionsCardProps {
  totalSessions: number;
}

export const TotalSessionsCard = ({
  totalSessions,
}: TotalSessionsCardProps) => {
  return (
    <Card variant="default">
      <div className="text-center">
        <div className="text-3xl font-black text-nb-blue mb-1">
          {totalSessions}
        </div>
        <div className="text-xs font-bold text-gray-600">総セッション数</div>
      </div>
    </Card>
  );
};
