import { Temporal } from "temporal-polyfill";

type prop = {
  title: string;
  isbn: string;
  pageCount: number;
  lastRead: Temporal.PlainDate;
  progress: number;
};

function Bookdata(props: prop) {
  return (
    <li className="BookCard" id={props.isbn}>
      <span>{props.title}</span>
      <span> / </span>
      <span>{props.isbn}</span>
      <span> / </span>
      <span>{props.pageCount}ページ</span>
      <span> / </span>
      <span>最後に読んだ日: {props.lastRead.toString()}</span>
      <span> / </span>
      <span>進捗: {props.progress}%</span>
    </li>
  );
}

export default Bookdata;

