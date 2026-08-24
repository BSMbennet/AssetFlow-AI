# AssetFlow AI — Next Steps

## Immediate — make production usable

1. Verify the Vercel production build uses `apps/web` as the Next.js application.
2. Confirm Vercel has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured for Production.
3. Sign up a test user and verify organization/profile creation.
4. Create a private-credit asset from the dashboard.
5. Upload a PDF/DOCX/XLSX document and verify it appears in Supabase Storage and the `documents` table.
6. Add a document-processing status workflow.

## Milestone 2 — Asset Intelligence

- Document classification
- OCR/text extraction
- Private-credit field extraction
- Evidence/source references
- Confidence scores
- Extracted-data review UI
- Asset Intelligence Profile

## Milestone 3 — Risk & Compliance

- Risk assessment records
- Risk breakdown and explanations
- Compliance readiness checklist
- Missing-document detection
- Conflict detection
- Human approval workflow
- Audit trail

## Milestone 4 — Monitoring

- Covenant monitoring
- Financial statement refresh
- Document expiration alerts
- Risk-change alerts
- Compliance alerts
- Activity timeline

## Milestone 5 — Institutional workflows

- Organization/user roles
- Analyst/reviewer permissions
- Asset reporting
- Exportable Asset Intelligence Report
- Portfolio analytics
- Admin controls

## Phase 2 — Tokenization

Only after the Asset Intelligence MVP is useful to pilot customers:

- Token issuance abstraction
- Investor eligibility
- Transfer restrictions
- Ethereum/Polygon adapters
- Custody partner integration
- Stablecoin/financial-rail integrations
- Settlement workflows

## Product rule

Do not let tokenization distract from the first killer workflow:

`Private-credit documents → AI understanding → structured asset data → risk/compliance → human review → institution-ready asset`
