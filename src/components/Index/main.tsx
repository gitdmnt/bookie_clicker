type Pages = "Search" | "Bookshelf" | "Analytics" | "Settings";

export const Index = (props: { currPage: Pages; handleIndex: any }) => {
  const { currPage, handleIndex } = props;

  return (
    <header className="grid grid-rows-4 mx-2 justify-start justify-items-start text-2xl">
      <EachIndex name="Search" currPage={currPage} handleIndex={handleIndex} />
      <EachIndex
        name="Bookshelf"
        currPage={currPage}
        handleIndex={handleIndex}
      />
      <EachIndex
        name="Analytics"
        currPage={currPage}
        handleIndex={handleIndex}
      />
      <EachIndex
        name="Settings"
        currPage={currPage}
        handleIndex={handleIndex}
      />
    </header>
  );
};

const EachIndex = (props: any) => {
  const name = props.name;
  const currPage = props.currPage;
  const handleIndex = props.handleIndex;
  const handleIndexStyle = () => {
    return currPage === name ? "col-span-1" : "col-span-1 text-stone-300";
  };

  return (
    <div className={handleIndexStyle()} onClick={() => handleIndex(name)}>
      {name}
    </div>
  );
};

