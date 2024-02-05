function Graph(props: any) {
  const term = props.term;
  return (
    <div className="Graph">
      <h3>グラフ</h3>
      ここに{term[0].toLocaleDateString()}から{term[1].toLocaleDateString()}
      までのグラフが入る
    </div>
  );
}

export default Graph;

