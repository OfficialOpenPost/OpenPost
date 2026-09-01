# Webhooks

HMAC SHA256(timestamp.body), X-OpenPost-Signature, 5min tolerance, idempotency via deliveryId, retries 3 with backoff, SSRF block.
