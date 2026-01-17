export const BookDisplay = ({ book }: { book: Book | null }) => {
  return (
    <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6">
      {book ? (
        <div className="flex items-center gap-4">
          <img
            src={book.imageUrl}
            alt={book.title}
            className="h-24 w-16 rounded-lg object-cover"
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {book.title}
            </h2>
            <p className="text-gray-600">by {book.authors}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">No book selected.</p>
      )}
    </div>
  );
};
