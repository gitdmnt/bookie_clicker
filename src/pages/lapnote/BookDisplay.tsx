const BookDisplay = ({ book }: { book: Book | null }) => (
  <div className="">
    <img src={book?.imageUrl} alt={book?.title} className="" />
    <div>
      <h2 className="">{book?.title}</h2>
      <p className="">
        {(book?.authors ?? []).join(" / ")} ・ {book?.publisher} ・{" "}
        {book?.year ?? "年不明"} ・ {book?.pageCount}
        ページ
      </p>
    </div>
  </div>
);

export default BookDisplay;
