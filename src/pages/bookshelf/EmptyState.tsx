export const EmptyState = ({ onAction }: { onAction: () => void }) => (
  <div className="flex h-80 flex-col items-center justify-center gap-4 p-8 text-center">
    <div className="text-6xl">📭</div>
    <p className="text-2xl font-black text-black">本が見つかりません</p>
    <p className="text-sm font-semibold text-gray-600">
      タイトルや著者名で検索するか、ライブラリを再読み込みしてください。
    </p>
    <button
      type="button"
      className="rounded-lg border-3 border-black bg-nb-pink-400 px-6 py-3 text-sm font-black text-white shadow-brutal hover:shadow-brutal-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all uppercase tracking-wide"
      onClick={onAction}
    >
      🔄 Refresh
    </button>
  </div>
);
