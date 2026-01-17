interface MenuBarProps {
  setPage: (page: number) => void;
  icons: React.ReactNode[];
}

const MenuBar: React.FC<MenuBarProps> = ({ setPage, icons }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full z-10 h-20">
      <div className="flex justify-between card m-2">
        {icons.map((icon, index) => (
          <button
            key={index}
            className="flex flex-1 flex-col items-center justify-center text-gray-600 hover:text-gray-800"
            onClick={() => setPage(index)}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MenuBar;
