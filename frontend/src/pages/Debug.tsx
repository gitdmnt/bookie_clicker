import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export const Debug = () => {
  const [rawQuery, setRawQuery] = useState<string>("");
  return (
    <div>
      <h1>Debug Page</h1>
      <input
        type="text"
        placeholder="Enter raw query"
        value={rawQuery}
        onChange={(e) => setRawQuery(e.target.value)}
        style={{ width: "80%" }}
      />
      <button
        onClick={async () => {
          try {
            const result = await invoke("query_raw", { query: rawQuery });
            console.log("Query Result:", result);
          } catch (error) {
            console.error("Query Error:", error);
          }
        }}
      >
        Execute Query
      </button>
    </div>
  );
};
