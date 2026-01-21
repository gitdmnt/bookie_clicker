import Card from "@/components/ui/Card";
import { formatReadingTime } from "../utils";

interface TotalReadingTimeCardProps {
  totalReadingTime: number; // in seconds
}

export const TotalReadingTimeCard = ({
  totalReadingTime,
}: TotalReadingTimeCardProps) => {
  const formattedTime = formatReadingTime(totalReadingTime);

  return (
    <Card variant="default">
      <div className="text-center">
        <div className="text-4xl font-black text-nb-purple mb-2">
          {formattedTime}
        </div>
        <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">
          ⏱️ 総読書時間
        </div>
      </div>
    </Card>
  );
};
