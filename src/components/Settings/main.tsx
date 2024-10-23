import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import "./type.d.ts";

export const Settings = () => {
  const [bookshelf_path, setBookshelfPath] = useState("");

  useEffect(() => {
    invoke("get_config").then((c) => {
      const config = c as Config;
      setBookshelfPath(config.bookshelf_path);
    });
  }, []);

  useEffect(() => {
    const config = { bookshelf_path };
    invoke("set_config", { config }).then((msg) => {
      console.log(msg);
    });
  }, [bookshelf_path]);

  return (
    <div className="Settings">
      <div className="SettingsItem">
        <div>ディレクトリ</div>
        <input
          type="text"
          value={bookshelf_path}
          onChange={(e) => setBookshelfPath(e.target.value)}
        />
      </div>
    </div>
  );
};

