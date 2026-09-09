# AssetFlow AI — Next Steps

## Immediate — make production usable

1. Verify the Vercel production build uses `apps/web` as the Next.js application.
2. Confirm Vercel has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured for Production.
3. Sign up a test user and verify organization/profile creation.
4. Create a private-credit asset from the dashboard.
5. Upload a PDF/DOCX/XLSX document and verify it appears in Supabase Storage and the `documents` table.
6. Add a document-processing status workflow.

## Delivered — Settlement & Servicing

- Controlled settlement instruction lifecycle
- Rail adapter abstraction
- Settlement reconciliation and event history
- Corporate actions and servicing positions
- Interest, dividend, principal, fee and maturity workflows

## Phase 9 — Investor Reporting & Statements

- Portfolio-level reporting
- Asset-level statements
- Investor position reporting
- Servicing cash-flow history
- Risk and compliance snapshots
- Exportable institutional CSV reports
- Reporting controls and refresh state

## Next — Institutional Reporting Expansion

- Investor-specific statement generation
- PDF statement packs
- Capital activity and transaction history
- NAV/valuation snapshots
- Period-over-period performance
- Scheduled reporting jobs
- Secure investor report delivery
- Immutable report/audit references

## Product rule

Do not let reporting become a second source of truth. Reports must be derived from live AssetFlow records and remain traceable to the underlying asset, servicing, settlement, risk and compliance events.
