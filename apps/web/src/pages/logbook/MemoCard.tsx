import { useState } from "react";
import { formatTime, formatDateTime } from "./utils";

interface MemoCardProps {
  lap: Lap;
}

export const MemoCard = ({ lap }: MemoCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="rounded-lg border-3 border-black bg-white p-4 shadow-brutal-sm hover:shadow-brutal transition-shadow cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="inline-block px-3 py-1 bg-nb-pink-500 text-white font-bold text-sm rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            p.{lap.refPage}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-500">
              {formatDateTime(lap.createdAt)}
            </span>
            <span className="text-xs font-bold text-nb-purple">
              ⏱️ {formatTime(lap.elapsedMs / 1000)}
            </span>
          </div>

          {lap.note ? (
            <div
              className={`text-sm text-gray-700 leading-relaxed ${!isExpanded ? "line-clamp-3" : ""}`}
            >
              {lap.note}
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">メモなし</div>
          )}

          {!isExpanded && lap.note && lap.note.length > 100 && (
            <div className="mt-2 text-xs font-bold text-nb-pink-600">
              クリックして続きを読む...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
