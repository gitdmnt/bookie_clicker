import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import Toggle from "react-styled-toggle";

type Config = {
  debug: boolean;
  dirPath: string;
};

export const Config = () => {
  const [debug, setDebug] = useState(true);
  const [dirPath, setDirPath] = useState("");
  const configLoader = async () => {
    console.log("a");
    const config: Config = await invoke("fetch_config");
    setDebug(config.debug);
    setDirPath(config.dirPath);
    console.log(config);
  };
  return (
    <div className="Config" onLoad={() => configLoader()}>
      <h2>設定</h2>
      <button onClick={() => configLoader()}>ファイルから設定を読み込む</button>
      <Toggle
        labelLeft="デバッグモード"
        checked={debug}
        onChange={() => setDebug(!debug)}
      />
      <input
        value={dirPath}
        placeholder={dirPath + "a"}
        onChange={(e) => setDirPath(e.target.value)}
      />
      <button
        onClick={async () => {
          const config: Config = { debug, dirPath };
          await invoke("set_config", { config });
        }}
      >
        設定書き込み
      </button>
    </div>
  );
};
