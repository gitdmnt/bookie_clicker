export const EmptyState = ({ onAction }: { onAction: () => void }) => (
  <div className="flex h-80 flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
    <p className="text-lg font-semibold text-slate-700">No books found</p>
    <p className="text-sm text-slate-400">
      タイトルや著者名で検索するか、ライブラリを再読み込みしてください。
    </p>
    <button
      type="button"
      className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
      onClick={onAction}
    >
      Refresh
    </button>
  </div>
);
