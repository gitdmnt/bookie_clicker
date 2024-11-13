import { useBookContext } from "../../../../hooks/bookContextHook";

export const ShowBookInfo = () => {
  /*
    1. 書籍情報を表示する。
   */
  const { bookInfoContainer, bookInfoIndex, setBookInfoIndex } =
    useBookContext();

  const activeItemStyle = (index: number) => {
    if (index === bookInfoIndex) {
      return { backgroundColor: "skyblue" };
    }
  };

  const handleBookSelection = (index: number) => {
    setBookInfoIndex(index);
  };

  const bookInfoItems = bookInfoContainer.map(
    (bookInfo: BookInfo, index: number) => (
      <div
        className="BookInfo"
        onClick={() => handleBookSelection(index)}
        style={activeItemStyle(index)}
        key={index}
      >
        <div className="title">{bookInfo.title}</div>
        <div className="subtitle">{bookInfo.subtitle}</div>
        <div className="authors">{(bookInfo.authors ?? []).join(", ")}</div>
        <div className="image_url">
          <img src={bookInfo.image_url ?? ""} alt="book cover" />
        </div>
        <div className="total_page_count">{bookInfo.total_page_count}</div>
      </div>
    )
  );

  return <div className="BookInfoContainer">{bookInfoItems}</div>;
};

