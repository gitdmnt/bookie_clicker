/**
 * PKCE (Proof Key for Code Exchange) ヘルパー関数群
 * OAuth 2.0 の PKCE フロー実装に必要なユーティリティ
 */

/** Uint8Array を Base64URL エンコードする */
export const base64UrlEncode = (buffer: Uint8Array): string =>
  btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

/** PKCE の code_verifier をランダム生成する */
export const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
};

/** code_verifier から code_challenge (S256) を生成する */
export const generateCodeChallenge = async (
  verifier: string,
): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
};

