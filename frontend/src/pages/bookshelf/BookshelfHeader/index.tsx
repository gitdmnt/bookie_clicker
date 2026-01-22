import { useState } from "react";
import BarcodeScanner from "./BarcodeScanner";

export const BookshelfHeader = ({
  totalBooks,
  filteredBooks,
  searchTerm,
  onSearchTermChange,
  onBarcodeScanned,
}: {
  totalBooks: number;
  filteredBooks: number;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onBarcodeScanned: (isbn: string) => void;
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScanSuccess = (isbn: string) => {
    onBarcodeScanned(isbn);
  };

  return (
    <>
      <div className="flex flex-col gap-2 overflow-hidden">
        <div className="flex flex-row gap-2">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            className="flex-1 min-w-0 text-xs rounded-lg border-3 border-black bg-white px-4 py-3 font-bold text-black placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-nb-pink-200 shadow-brutal-sm"
            placeholder="🔍 ISBN・タイトル・著者・出版社・年で検索"
            aria-label="Search books"
          />
          <button
            onClick={() => setIsScannerOpen(true)}
            className="rounded-lg border-3 border-black bg-nb-yellow px-4 py-3 text-2xl hover:bg-nb-yellow/80 active:translate-x-1 active:translate-y-1 shadow-brutal-sm hover:shadow-brutal transition-all"
            aria-label="Scan barcode"
            title="バーコードスキャン"
          >
            📷
          </button>
        </div>
        <div className="text-xs font-semibold text-gray-500 px-1">
          {filteredBooks} / {totalBooks} titles
        </div>
      </div>

      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
};
