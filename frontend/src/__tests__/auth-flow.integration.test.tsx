/**
 * 認証フローの結合テスト
 *
 * ProtectedRoute, Login, AuthCallback の統合動作をテストする。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Login } from "@/pages/Login";

// AuthContext をモック
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const renderWithRouter = (initialRoute: string, children: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>,
  );

describe("認証フロー 結合テスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ProtectedRoute", () => {
    it("認証中はローディング表示", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
      });

      renderWithRouter(
        "/",
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
      );

      expect(screen.getByText("読み込み中...")).toBeTruthy();
    });

    it("未認証ユーザーはログインページにリダイレクト", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      renderWithRouter(
        "/",
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>,
      );

      expect(screen.getByText("Login Page")).toBeTruthy();
    });

    it("認証済みユーザーは保護されたコンテンツを表示", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: "1", email: "test@test.com" },
      });

      renderWithRouter(
        "/",
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
      );

      expect(screen.getByText("Protected Content")).toBeTruthy();
    });
  });

  describe("Login ページ", () => {
    it("ログインボタンが表示される", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        user: null,
      });

      renderWithRouter(
        "/login",
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>,
      );

      expect(screen.getByText("Googleでログイン")).toBeTruthy();
    });

    it("アプリ名が表示される", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        user: null,
      });

      renderWithRouter(
        "/login",
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>,
      );

      expect(screen.getByText(/Bookie Clicker/)).toBeTruthy();
    });
  });
});

