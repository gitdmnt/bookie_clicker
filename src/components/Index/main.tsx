import { usePageContext } from "../../hooks/pageContextHook";

export const Index = () => {
  const { page, setPage } = usePageContext();

  return (
    <header className="grid grid-rows-4 mx-2 justify-start justify-items-start">
      <EachIndex name="bookshelf" page={page} setPage={setPage} />
      <EachIndex name="analytics" page={page} setPage={setPage} />
      <EachIndex name="settings" page={page} setPage={setPage} />
    </header>
  );
};

const EachIndex = (props: any) => {
  const name = props.name;
  const page = props.page;
  const setPage = props.setPage;

  return <div onClick={() => setPage(name)}>{name}</div>;
};

