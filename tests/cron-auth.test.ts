import { describe, it, expect } from "vitest";
import crypto from "crypto";

describe("Cron Authentication & Constant-Time Secret Verification", () => {
  function verifySecret(bearerSecret: string, cronSecret: string): boolean {
    const bearerHash = crypto.createHash("sha256").update(bearerSecret).digest();
    const secretHash = crypto.createHash("sha256").update(cronSecret).digest();
    return crypto.timingSafeEqual(bearerHash, secretHash);
  }

  it("authenticates matching cron secret", () => {
    const secret = "cron_secret_key_1234567890abcdef";
    expect(verifySecret(secret, secret)).toBe(true);
  });

  it("rejects mismatched cron secret", () => {
    const secret = "cron_secret_key_1234567890abcdef";
    const wrongSecret = "cron_secret_key_wrong";
    expect(verifySecret(wrongSecret, secret)).toBe(false);
  });

  it("handles different length secrets safely without throwing buffer length exceptions", () => {
    const secret = "short";
    const longSecret = "very_long_secret_string_that_exceeds_length_of_short";
    expect(verifySecret(longSecret, secret)).toBe(false);
    expect(verifySecret(secret, longSecret)).toBe(false);
  });
});
