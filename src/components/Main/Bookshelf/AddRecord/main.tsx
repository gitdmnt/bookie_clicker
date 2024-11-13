export const AddRecord = (props: { isbn: number }) => {
  return (
    <>
      <Search />
      <InputActivity />
    </>
  );
};

const Search = () => {
  return <></>;
};

const InputActivity = () => {
  return (
    <div>
      <input type="text" />
      <button>Save</button>
    </div>
  );
};

