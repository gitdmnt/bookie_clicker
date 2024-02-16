function Graph(props: any) {
    const term = props.term;
    return (
        <div className="Graph">
            <div className="Statistics">
                ここに{term[0].toLocaleDateString()}から{term[1].toLocaleDateString()}までの統計が入る
            </div>
        </div>
    );
}

export default Graph;