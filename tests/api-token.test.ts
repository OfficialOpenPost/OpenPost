import { describe, it, expect } from "vitest";
import { generateApiToken, hashToken } from "../src/lib/apiToken";

describe("API Token Generation & Crypto Hashing", () => {
  it("generates 64-hex-character token with 'op_live_' prefix", () => {
    const { rawToken, tokenHash, tokenPrefix } = generateApiToken();

    expect(rawToken).toMatch(/^op_live_[0-9a-f]{64}$/);
    expect(tokenPrefix).toMatch(/^op_live_[0-9a-f]{6}\.\.\.$/);
    expect(tokenHash).toHaveLength(64); // SHA-256 output is 64 hex chars
  });

  it("produces deterministic SHA-256 token hash", () => {
    const sampleToken = "op_live_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const hash1 = hashToken(sampleToken);
    const hash2 = hashToken(sampleToken);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates distinct high-entropy random tokens", () => {
    const token1 = generateApiToken();
    const token2 = generateApiToken();

    expect(token1.rawToken).not.toBe(token2.rawToken);
    expect(token1.tokenHash).not.toBe(token2.tokenHash);
    expect(token1.tokenPrefix).not.toBe(token2.tokenPrefix);
  });
});
