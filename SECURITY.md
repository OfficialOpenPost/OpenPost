# Security Policy

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

**[INSERT SECURITY EMAIL ADDRESS]**

You should receive a response within 48 hours. If for some reason you do not,
please follow up to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Disclosure Policy

When we receive a security report, we will:

1. Confirm the vulnerability and determine its impact
2. Audit related code for any similar issues
3. Prepare a fix and release it as soon as possible
4. Publish a security advisory on GitHub
5. Credit the reporter (unless they prefer to remain anonymous)

## Security Related Configuration

The following environment variables affect security:

- `CRON_SECRET` - Secret for cron job authentication
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side Supabase key (never expose to client)
- `NEXTAUTH_SECRET` - Authentication secret
- `REQUIRE_EMAIL_VERIFICATION` - Enforce email verification

## Security Best Practices

When deploying OpenPost:

1. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
2. Use HTTPS in production
3. Set `CRON_SECRET` for scheduled publishing
4. Enable `REQUIRE_EMAIL_VERIFICATION=true` for production
5. Regularly update dependencies
6. Review audit logs regularly

## Known Security Gaps & Guidelines

### Media Upload
- All uploads are validated using magic bytes
- Server generates file keys (not client-controlled)
- SHA256 checksums are computed server-side

### Webhooks
- SSRF protection blocks localhost, private IPs, and metadata endpoints
- HMAC-SHA256 signature verification
- 5-second timeout per delivery attempt
- Secrets are masked in responses

### RBAC
- 5-tier role hierarchy enforced server-side
- Project isolation enforced via `requireProjectMember`
- Never trust client-provided role information

### API
- Rate limiting on invite endpoints (10/min/IP)
- API tokens are SHA256 hashed in database
- Bearer token authentication for public API
- Input validation on all endpoints

## Contact

For any security concerns, please contact:

- **Email:** [INSERT SECURITY EMAIL ADDRESS]
- **GitHub Issues:** For non-sensitive issues only

Thank you for helping keep OpenPost and its users safe.
