# Security

## API security baseline

- Authentication is JWT-based and protected routes require an access token.
- Access tokens carry `type=access`; refresh tokens carry `type=refresh` and are rotated on use.
- User authorization is evaluated from current database state, so suspended/deleted users and changed roles take effect without waiting for token expiry.
- Registration cannot self-assign a role or join an arbitrary organization; new accounts are investors in a newly created pending organization.
- Global request validation rejects unknown fields and transforms validated DTOs only.
- Global throttling uses the Render Redis `REDIS_URL` connection and an atomic Redis Lua counter with expiry.
- Production CORS requires an explicit `CORS_ORIGIN` allow-list.
- Production Express proxy trust is explicitly bounded by `TRUST_PROXY_HOPS` so rate-limit keys use the real client IP without trusting arbitrary forwarded headers.
- Swagger is disabled in production unless `ENABLE_SWAGGER=true`.
- Stripe webhooks use the raw request body and Stripe signature verification.
- Blockchain issuance requires an authenticated administrator and validates recipient, amount, and request ID formats.
- Client-submitted blockchain transaction hashes are never treated as payment proof and remain `PROCESSING` until independent verification.

## API inventory

Current API surface is intentionally small and should remain authenticated by default:

- `POST /api/v1/auth/register` — public registration.
- `POST /api/v1/auth/login` — public credential authentication.
- `POST /api/v1/auth/refresh` — public refresh-token rotation.
- `POST /api/v1/auth/forgot-password` — public, generic password-recovery request.
- `POST /api/v1/auth/reset-password` — public, short-lived one-time reset token.
- `POST /api/v1/auth/logout` and `GET /api/v1/auth/me` — authenticated user operations.
- `GET /api/v1/health` — public operational health status; must not expose secrets or internal diagnostics.
- `GET /api/v1/blockchain/status` — public adapter status; must not expose credentials or private keys.
- `POST /api/v1/blockchain/issuance/:requestId/prepare` and `/execute` — authenticated administrators only.
- `POST /api/v1/payments/checkout/stripe` and `/checkout/crypto` — authenticated users only.
- `POST /api/v1/payments/webhook/stripe` — public transport endpoint protected by Stripe signature verification.
- `GET /api/v1/users/me`, `PATCH /api/v1/users/me`, and organization-scoped user listing — authenticated users only.
- `GET /api/v1/admin/overview` — authenticated administrators only and organization-scoped.

Any new endpoint must document its authentication, authorization scope, input DTO, rate-limit needs, and whether it handles sensitive data before release.

## Required production configuration

Set at minimum:

- `NODE_ENV=production`
- `JWT_SECRET` (32+ characters of high-entropy randomness)
- `REDIS_URL` (Render Key Value connection string)
- `CORS_ORIGIN` (comma-separated trusted origins)
- `FRONTEND_URL` (trusted HTTPS application origin)
- `TRUST_PROXY_HOPS` (normally `1` on Render)
- `RESEND_API_KEY` and `RESET_EMAIL_FROM` for password recovery
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` when Stripe is enabled
- `BLOCKCHAIN_RPC_URL`, `BLOCKCHAIN_CHAIN_ID`, `BLOCKCHAIN_TOKEN_CONTRACT_ADDRESS`, and `BLOCKCHAIN_PRIVATE_KEY` only when blockchain execution is enabled
- `SEED_ADMIN_PASSWORD` only when the database seed script is intentionally run

Never commit real credentials, private keys, webhook secrets, database passwords, reset tokens, or API keys.

## Payment and blockchain workflow

Client-submitted transaction hashes are not proof of payment. Blockchain payments must remain pending/processing until an independent verifier confirms the expected network, recipient, asset, amount, and finality. Stripe completion is accepted only from a signature-verified webhook, and duplicate webhook delivery must be harmless.

## Password recovery

Password reset uses a cryptographically random, 15-minute token. Only a SHA-256 hash of the token is stored in the database; the raw token is delivered out-of-band by email and is invalidated after one successful use. Access and refresh JWTs are never accepted as password-reset credentials.

## SSRF and external requests

Server-side outbound requests must use fixed provider origins and never directly dereference user-supplied URLs. Persisted URLs such as asset websites/report links are data only; if a future feature fetches them, it must add explicit HTTPS allow-listing, DNS/IP validation, redirect controls, and timeouts.

## Logging and sensitive data

Do not log passwords, JWTs, refresh tokens, password-reset tokens, API keys, Stripe signatures, private keys, or complete payment credentials. Use internal IDs for payment/blockchain diagnostics rather than transaction secrets.
