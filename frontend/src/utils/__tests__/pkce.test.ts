/**
 * pkce.ts のユニットテスト
 */
import { describe, it, expect } from "vitest";
import {
  base64UrlEncode,
  generateCodeVerifier,
  generateCodeChallenge,
} from "@/utils/pkce";

describe("base64UrlEncode", () => {
  it("空バッファは空文字列を返す", () => {
    expect(base64UrlEncode(new Uint8Array([]))).toBe("");
  });

  it("Base64URL安全な文字のみを使用する", () => {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    const encoded = base64UrlEncode(buffer);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("パディング(=)が含まれない", () => {
    // 3の倍数でないバイト長でパディングが出ることを確認除去
    const buffer = new Uint8Array([1, 2]);
    const encoded = base64UrlEncode(buffer);
    expect(encoded).not.toContain("=");
  });

  it("+と/が含まれない", () => {
    // 多数のランダムバイトで確認
    const buffer = new Uint8Array(256);
    crypto.getRandomValues(buffer);
    const encoded = base64UrlEncode(buffer);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
  });
});

describe("generateCodeVerifier", () => {
  it("43文字以上の文字列を返す", () => {
    const verifier = generateCodeVerifier();
    // 32バイト → Base64URL で 43文字
    expect(verifier.length).toBeGreaterThanOrEqual(43);
  });

  it("Base64URL安全な文字のみ", () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("呼び出しごとに異なる値を返す", () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).not.toBe(b);
  });
});

describe("generateCodeChallenge", () => {
  it("Base64URL安全な文字列を返す", async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("同じverifierには同じchallengeを返す", async () => {
    const verifier = "test-verifier-fixed";
    const c1 = await generateCodeChallenge(verifier);
    const c2 = await generateCodeChallenge(verifier);
    expect(c1).toBe(c2);
  });

  it("異なるverifierには異なるchallengeを返す", async () => {
    const c1 = await generateCodeChallenge("verifier-1");
    const c2 = await generateCodeChallenge("verifier-2");
    expect(c1).not.toBe(c2);
  });

  it("SHA-256 の 32バイトハッシュ → 43文字のBase64URLを返す", async () => {
    const challenge = await generateCodeChallenge("any-verifier");
    expect(challenge.length).toBe(43);
  });
});

