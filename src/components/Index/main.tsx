import { usePageContext } from "../../pageContextHook";

export const Index = () => {
  const { page, setPage } = usePageContext();

  return (
    <header className="grid grid-rows-4 mx-2 justify-start justify-items-start">
      <EachIndex name="Search" page={page} setPage={setPage} />
      <EachIndex name="Bookshelf" page={page} setPage={setPage} />
      <EachIndex name="Analytics" page={page} setPage={setPage} />
      <EachIndex name="Settings" page={page} setPage={setPage} />
    </header>
  );
};

const EachIndex = (props: any) => {
  const name = props.name;
  const page = props.page;
  const setPage = props.setPage;
  const setPageStyle = () => {
    return page === name ? "col-span-1" : "col-span-1 text-stone-300";
  };

  return (
    <div className={setPageStyle()} onClick={() => setPage(name)}>
      {name}
    </div>
  );
};

