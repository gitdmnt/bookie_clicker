import Card from "@/components/ui/Card";

interface TotalReadingTimeCardProps {
  totalReadingTime: number;
}

const formatReadingTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export const TotalReadingTimeCard = ({
  totalReadingTime,
}: TotalReadingTimeCardProps) => {
  return (
    <Card variant="default">
      <div className="text-center">
        <div className="text-3xl font-black text-nb-purple mb-1">
          {formatReadingTime(totalReadingTime)}
        </div>
        <div className="text-xs font-bold text-gray-600">総読書時間</div>
      </div>
    </Card>
  );
};
