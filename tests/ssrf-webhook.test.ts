import { describe, it, expect } from "vitest";
import { isAllowedWebhookUrl, signPayload, verifySignature, isTimestampFresh } from "../src/lib/webhooks";

describe("Webhook SSRF Protection & Cryptographic Signing", () => {
  it("blocks localhost, loopback, and internal IPs from SSRF attacks", () => {
    expect(isAllowedWebhookUrl("http://localhost:3000/webhook").allowed).toBe(false);
    expect(isAllowedWebhookUrl("http://127.0.0.1:8080/hook").allowed).toBe(false);
    expect(isAllowedWebhookUrl("http://0.0.0.0:3000").allowed).toBe(false);
    expect(isAllowedWebhookUrl("http://[::1]:80").allowed).toBe(false);
  });

  it("blocks RFC-1918 private subnets", () => {
    expect(isAllowedWebhookUrl("https://10.0.0.1/webhook").allowed).toBe(false);
    expect(isAllowedWebhookUrl("https://192.168.1.100/webhook").allowed).toBe(false);
    expect(isAllowedWebhookUrl("https://172.16.0.50/webhook").allowed).toBe(false);
  });

  it("blocks cloud instance metadata endpoints", () => {
    expect(isAllowedWebhookUrl("http://169.254.169.254/latest/meta-data/").allowed).toBe(false);
    expect(isAllowedWebhookUrl("http://metadata.google.internal/computeMetadata/v1/").allowed).toBe(false);
  });

  it("permits valid public HTTPS webhook endpoints", () => {
    expect(isAllowedWebhookUrl("https://api.example.com/webhooks/openpost").allowed).toBe(true);
    expect(isAllowedWebhookUrl("https://hooks.slack.com/services/T00/B00/XXXX").allowed).toBe(true);
  });

  it("signs and verifies HMAC payloads in constant time", () => {
    const timestamp = new Date().toISOString();
    const body = JSON.stringify({ event: "post.published", id: "123" });
    const secret = "whsec_super_secret_webhook_key_123456";

    const signature = signPayload(timestamp, body, secret);
    expect(signature).toHaveLength(64); // SHA-256 hex string

    // Correct signature matches
    expect(verifySignature(timestamp, body, signature, secret)).toBe(true);

    // Tampered body fails verification
    const tamperedBody = JSON.stringify({ event: "post.published", id: "999" });
    expect(verifySignature(timestamp, tamperedBody, signature, secret)).toBe(false);

    // Wrong secret fails verification
    expect(verifySignature(timestamp, body, signature, "wrong_secret")).toBe(false);
  });

  it("rejects expired webhook timestamps beyond tolerance window", () => {
    const freshTimestamp = new Date().toISOString();
    expect(isTimestampFresh(freshTimestamp)).toBe(true);

    const expiredTimestamp = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 mins ago
    expect(isTimestampFresh(expiredTimestamp)).toBe(false);
  });
});
