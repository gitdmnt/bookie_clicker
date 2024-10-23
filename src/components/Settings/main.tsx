export const Settings = () => {
  return (
    <div className="Settings">
      <div className="SettingsItem">
        <div>表示言語</div>
        <select>
          <option>日本語</option>
          <option>英語</option>
        </select>
      </div>
      <div className="SettingsItem">
        <div>表示順序</div>
        <select>
          <option>新しい順</option>
          <option>古い順</option>
        </select>
      </div>
    </div>
  );
};
