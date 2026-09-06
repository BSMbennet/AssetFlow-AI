# Security

## API security baseline

- Authentication is JWT-based and protected routes require an access token.
- Access tokens carry `type=access`; refresh tokens carry `type=refresh` and are rotated on use.
- User authorization is evaluated from current database state, so suspended/deleted users and changed roles take effect without waiting for token expiry.
- Registration cannot self-assign a role or join an arbitrary organization; new accounts are investors in a newly created pending organization.
- Global request validation rejects unknown fields and transforms validated DTOs only.
- Global throttling uses the Render Redis `REDIS_URL` connection and an atomic Redis Lua counter with expiry.
- Production CORS requires an explicit `CORS_ORIGIN` allow-list.
- Swagger is disabled in production unless `ENABLE_SWAGGER=true`.
- Stripe webhooks use the raw request body and Stripe signature verification.
- Blockchain issuance requires an authenticated administrator and validates recipient, amount, and request ID formats.

## Required production configuration

Set at minimum:

- `NODE_ENV=production`
- `JWT_SECRET` (32+ characters of high-entropy randomness)
- `REDIS_URL` (Render Key Value connection string)
- `CORS_ORIGIN` (comma-separated trusted origins)
- `FRONTEND_URL` (trusted HTTPS application origin)
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` when Stripe is enabled
- `BLOCKCHAIN_RPC_URL`, `BLOCKCHAIN_CHAIN_ID`, `BLOCKCHAIN_TOKEN_CONTRACT_ADDRESS`, and `BLOCKCHAIN_PRIVATE_KEY` only when blockchain execution is enabled

Never commit real credentials, private keys, webhook secrets, database passwords, or API keys.

## Payment and blockchain workflow

Client-submitted transaction hashes are not proof of payment. Blockchain payments must remain pending/processing until an independent verifier confirms the expected network, recipient, asset, amount, and finality. Stripe completion is accepted only from a signature-verified webhook.

## Password recovery

Password reset must use a dedicated, short-lived `type=password-reset` credential delivered through a trusted out-of-band channel. Access and refresh tokens must never be accepted as password-reset tokens.
