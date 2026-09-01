import { signPayload, verifySignature, isTimestampFresh } from "../src/lib/webhooks";

test("valid signature accepted", () => {
  const ts = new Date().toISOString();
  const body = JSON.stringify({ event: "blog.published" });
  const secret = "test_secret";
  const sig = signPayload(ts, body, secret);
  expect(verifySignature(ts, body, sig, secret)).toBe(true);
});

test("modified body rejected", () => {
  const ts = new Date().toISOString();
  const body = JSON.stringify({ event: "blog.published" });
  const secret = "test_secret";
  const sig = signPayload(ts, body, secret);
  expect(verifySignature(ts, JSON.stringify({ event: "hacked" }), sig, secret)).toBe(false);
});

test("expired timestamp rejected", () => {
  const old = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  expect(isTimestampFresh(old)).toBe(false);
});
