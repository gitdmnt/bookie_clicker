import { MemoCard } from "./MemoCard";

interface MemoListProps {
  laps: Lap[];
  sortBy: "date" | "page";
  onSortChange: (sort: "date" | "page") => void;
}

export const MemoList = ({ laps, sortBy, onSortChange }: MemoListProps) => {
  return (
    <div className="rounded-lg border-3 border-black bg-white shadow-brutal-lg">
      <div className="p-4 border-b-3 border-black bg-nb-pink-50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-black">📝 読書メモ</h2>

          <div className="flex gap-2">
            <button
              onClick={() => onSortChange("date")}
              className={`px-4 py-2 font-bold text-sm rounded border-3 border-black transition-all ${
                sortBy === "date"
                  ? "bg-nb-pink-400 text-white shadow-brutal"
                  : "bg-white text-gray-700 shadow-brutal-sm hover:shadow-brutal"
              }`}
            >
              📅 日時順
            </button>
            <button
              onClick={() => onSortChange("page")}
              className={`px-4 py-2 font-bold text-sm rounded border-3 border-black transition-all ${
                sortBy === "page"
                  ? "bg-nb-pink-400 text-white shadow-brutal"
                  : "bg-white text-gray-700 shadow-brutal-sm hover:shadow-brutal"
              }`}
            >
              📖 ページ順
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
        {laps.length > 0 ? (
          laps.map((lap) => <MemoCard key={lap.id} lap={lap} />)
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <div className="font-semibold">まだメモがありません</div>
          </div>
        )}
      </div>
    </div>
  );
};
