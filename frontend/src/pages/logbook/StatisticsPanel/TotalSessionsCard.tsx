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
        <div className="text-4xl font-black text-nb-blue mb-2">
          {totalSessions}
        </div>
        <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">
          📚 読書セッション
        </div>
      </div>
    </Card>
  );
};
