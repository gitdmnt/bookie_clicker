import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import "./type.d.ts";
import { Temporal } from "proposal-temporal";

const today = new Date().toISOString().slice(0, 10);

export const Analytics = (props: { isVisible: boolean }) => {
  const [term, setTerm]: [[string, string], any] = useState([today, today]);
  const [query, setQuery]: [Query, any] = useState({
    term,
    rating: [1, 5],
    order: "Desc",
    key: "Date",
  });

  useEffect(() => {
    setQuery({
      term,
      rating: query.rating,
      order: query.order,
      key: query.key,
    });
  }, [term]);

  const queryMonthly: Query = {
    term: [new Date().toISOString().slice(0, 8) + "01", today],
    rating: [1, 5],
    order: "Desc",
    key: "Date",
  };

  const queryYearly: Query = {
    term: [new Date().toISOString().slice(0, 5) + "01-01", today],
    rating: [1, 5],
    order: "Desc",
    key: "Date",
  };

  const queryTotal: Query = {
    term: ["0000-00-00", today],
    rating: [1, 5],
    order: "Desc",
    key: "Date",
  };

  return (
    <div className="Analytics">
      <div className="Monthly">
        <h2>今月</h2>
        <Statisics query={queryMonthly} refresh={props.isVisible} />
      </div>
      <div className="Yearly">
        <h2>今年</h2>
        <Statisics query={queryYearly} refresh={props.isVisible} />
      </div>
      <div className="Total">
        <h2>全期間</h2>
        <Statisics query={queryTotal} refresh={props.isVisible} />
      </div>
      <div className="Any">
        <input
          type="date"
          value={term[0]}
          onChange={(e) => setTerm([e.target.value, term[1]])}
        />
        <span>から</span>
        <input
          type="date"
          value={term[1]}
          onChange={(e) => setTerm([term[0], e.target.value])}
        />
        <Statisics query={query} refresh={props.isVisible} />
      </div>
      <div className="Graph">
        <h2>読書量の推移</h2>
        <div>グラフ</div>
      </div>
    </div>
  );
};

const Statisics = (props: { query: Query; refresh: boolean }) => {
  const query = props.query;

  const [container, setContainer]: [Container[], any] = useState([]);

  useEffect(() => {
    invoke("get_records", { query }).then((s: any) => {
      setContainer(s);
    });
  }, [props.refresh]);

  // container is sorted by date in descending order
  const oldest = container.length !== 0 ? container[0].diaries[0].date : today;
  const termStart = Temporal.PlainDate.from(
    query.term[0] === "0000-00-00" ? oldest : query.term[0]
  );
  const termEnd = Temporal.PlainDate.from(query.term[1]);

  const bookCount = container.length;
  const pageCount = container.reduce(
    (a, b) =>
      (a += b.diaries.reduce((a, b) => (a += b.range[1] - b.range[0] + 1), 0)),
    0
  );
  const dayCount = termStart.until(termEnd).total({ unit: "days" }) + 1;
  const bookPerDay = (bookCount / dayCount).toFixed(2);
  const pagePerDay = (pageCount / dayCount).toFixed(2);
  const pagePerBook = (pageCount / bookCount).toFixed(2);

  return (
    <div>
      <div>
        読んだ本{bookCount}冊({pageCount}ページ)
      </div>
      <div>
        1日あたり{bookPerDay}冊({pagePerDay}ページ)
      </div>
      <div>読んだ本の平均ページ数: {pagePerBook}</div>
    </div>
  );
};

