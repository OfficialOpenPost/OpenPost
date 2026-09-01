# Polls & Voting API Reference

OpenPost allows you to embed interactive polls directly inside articles and collect votes with built-in fraud prevention and fingerprinting.

---

## 1. Get Poll Details & Options

`GET /api/v1/polls/:id`

Retrieves poll questions, options, total votes, and percentage distribution.

### Example Request

```bash
curl -X GET "https://your-openpost-domain.com/api/v1/polls/p1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d" \
  -H "X-OpenPost-Token: op_sec_your_token_here"
```

### Example Response (`200 OK`)

```json
{
  "id": "p1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d",
  "question": "Which database do you prefer for high-scale applications?",
  "type": "single",
  "status": "open",
  "showResults": "after_vote",
  "totalVotes": 142,
  "options": [
    {
      "id": "opt-1",
      "label": "PostgreSQL (Supabase)",
      "voteCount": 98,
      "percentage": 69.0
    },
    {
      "id": "opt-2",
      "label": "MySQL / PlanetScale",
      "voteCount": 32,
      "percentage": 22.5
    },
    {
      "id": "opt-3",
      "label": "MongoDB / DocumentDB",
      "voteCount": 12,
      "percentage": 8.5
    }
  ]
}
```

---

## 2. Submit a Poll Vote

`POST /api/v1/polls/:id/vote`

Casts a vote for one or more poll options.

### Security & Fraud Prevention
- OpenPost generates a cryptographic `voterFingerprint` hash combining the voter's client IP address, User-Agent, and browser session token.
- A database unique constraint on `(poll_id, voter_fingerprint)` ensures each visitor can only vote once.
- Submitting a duplicate vote returns an `HTTP 409 Conflict` error.

### Request Body

```json
{
  "optionId": "opt-1",
  "fingerprint": "client_browser_uuid_token_optional"
}
```

### Example Request

```bash
curl -X POST "https://your-openpost-domain.com/api/v1/polls/p1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d/vote" \
  -H "Content-Type: application/json" \
  -d '{
    "optionId": "opt-1"
  }'
```

### Example Response (`200 OK`)

```json
{
  "success": true,
  "message": "Vote recorded successfully.",
  "poll": {
    "totalVotes": 143,
    "selectedOptionId": "opt-1"
  }
}
```

### Duplicate Vote Error Response (`409 Conflict`)

```json
{
  "error": "Conflict",
  "message": "You have already voted in this poll.",
  "statusCode": 409
}
```
