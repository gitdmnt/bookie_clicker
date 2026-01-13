import { formatElapsed } from "../utils";

const LapHistory = ({ logs }: { logs: Lap[] }) => (
  <div className="mt-6 space-y-4">
    {logs.map((log, index) => (
      <div
        key={index}
        className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
      >
        <div className="rounded-lg bg-white p-2 shadow-sm">
          <div className="text-xs text-neutral-400">
            {formatElapsed(log.elapsedMs)} · p.
            {log.refPage ?? "—"}
          </div>
          <p>{log.note ?? "(メモなし)"}</p>
        </div>
      </div>
    ))}
  </div>
);

export default LapHistory;
