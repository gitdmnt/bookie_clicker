import { BookDisplay } from "./BookDisplay";

export const Logbook = ({ book }: { book: Book | null }) => {
  return (
    <main className="min-h-screen bg-neutral-50 p-4">
      <BookDisplay book={book} />
      <section className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-gray-800">Logbook</h1>
        <p className="mt-2 text-sm text-gray-500">
          読書記録の一覧をこのページで確認します。
        </p>

        <div className="mt-4">
          {/* Logbook content goes here */}
          <p className="text-gray-600">
            Logbook functionality is under development.
          </p>
        </div>
      </section>
    </main>
  );
};
