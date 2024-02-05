function Statistics(props: any) {
  const term = props.term;
  // const booklist = [];
  return (
    <div className="Statistics">
      <h3>統計</h3>
      ここに{term[0].toLocaleDateString()}から{term[1].toLocaleDateString()}
      までの統計が入る
    </div>
  );
}

export default Statistics;
