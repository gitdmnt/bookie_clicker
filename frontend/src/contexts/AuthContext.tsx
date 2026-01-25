/// AuthContext.tsxは、アプリケーション全体で認証状態を管理するためのコンテキストを提供します。
/// 以下の要素がexportされます:
/// - AuthProviderコンポーネント: 認証状態を管理し、子コンポーネントに提供する。
/// - useAuthフック: AuthProvider内で認証状態と操作関数を利用するためのカスタムフック。

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

interface User {
  id: string;
  google_id: string;
  email: string;
  name?: string;
  pictureUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => Promise<void>;
  loginDebug: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/// AuthProviderコンポーネントはアプリ全体で認証状態を管理する。
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時にセッション確認
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // サーバーにセッションIDを送信し、認証状態を確認。ユーザー情報を取得する。
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: "include", // Cookie送信
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Auth check failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    // PKCE実装
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // code_verifierをsessionStorageに保存
    sessionStorage.setItem("pkce_code_verifier", codeVerifier);

    // Google OAuth URLにリダイレクト
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=openid%20email%20profile&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`;

    window.location.href = authUrl;
  };

  const loginDebug = () => {
    setUser({
      id: "debug-user-123",
      email: "debug@example.com",
      name: "デバッグユーザー",
      pictureUrl: "https://github.com/identicons/debug.png",
      google_id: "debug-google-id",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    });
    setIsLoading(false);
  };

  const logout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginDebug,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/// useAuthフックはAuthContextを利用するためのカスタムフック。
/// 以下の値を提供する:
/// - user: 認証されたユーザー情報
/// - isLoading: 認証状態の読み込み中フラグ
/// - login: Google OAuthログインを開始する関数
/// - loginDebug: デバッグ用のログイン関数
/// - logout: ログアウト関数
/// - isAuthenticated: 認証済みフラグ
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// PKCE ヘルパー関数
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
