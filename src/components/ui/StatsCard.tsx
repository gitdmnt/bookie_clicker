import Card from "@/components/ui/Card";

export const StatsCard = ({
  color,
  emoji,
  value,
  title,
}: {
  color: string;
  emoji: string;
  value: number | string;
  title: string;
}) => (
  <Card variant="default">
    <div className="text-center flex flex-col items-center gap-2">
      <div className={`text-4xl font-black ${color}`}>
        {emoji} {value}
      </div>
      <div className="text-xs font-bold text-gray-600">{title}</div>
    </div>
  </Card>
);
