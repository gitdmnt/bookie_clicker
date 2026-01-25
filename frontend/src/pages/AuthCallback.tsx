/// AuthCallback.tsxは、OAuth認証のコールバックを処理するコンポーネントを提供します。
/// OAuth認証コードを受け取り、サーバーに送信してユーザーを認証します。

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    // TODO: ここら辺のエラーハンドリングをLogin.tsxに整備する
    if (error) {
      console.error("OAuth error:", error);
      navigate("/login?error=oauth_failed");
      return;
    }

    if (!code) {
      navigate("/login?error=no_code");
      return;
    }

    const codeVerifier = sessionStorage.getItem("pkce_code_verifier");
    if (!codeVerifier) {
      navigate("/login?error=no_verifier");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/google/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, code_verifier: codeVerifier }),
      });

      if (response.ok) {
        sessionStorage.removeItem("pkce_code_verifier");
        navigate("/"); // ログイン成功、ホームへ
      } else {
        const errorText = await response.text();
        console.error("Authentication failed:", errorText);
        throw new Error("Authentication failed");
      }
    } catch (error) {
      console.error("Callback error:", error);
      navigate("/login?error=callback_failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">認証中...</h2>
        <p className="text-gray-600">しばらくお待ちください</p>
      </div>
    </div>
  );
};
