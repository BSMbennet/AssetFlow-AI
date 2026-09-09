# AssetFlow AI — Master Institutional Platform Roadmap

## North Star
AssetFlow AI is the institutional operating system for real-world assets: intelligence first, financial rails second, governance throughout. The platform remains rail-agnostic so bank rails, stablecoins, CBDCs, Ethereum, Polygon, or future networks can plug into the same operating layer.

## Delivery principle
All phases share one control plane: identity → asset intelligence → workflow → decision → execution → servicing → reporting → continuous monitoring → governance. AI recommends and explains; authorized humans and deterministic policies retain decision authority.

| Phase | Capability | Primary outcome |
|---|---|---|
| 1 | Asset Intelligence | Ingest assets/documents, extract facts, normalize asset records |
| 2 | Tokenization | Structure eligible assets and create tokenization-ready representations |
| 3 | Risk + Compliance | Risk scoring, KYC/AML/compliance readiness and review gates |
| 4 | Portfolio Monitoring | Continuous asset/portfolio health and risk visibility |
| 5 | Tokenization | Institutional issuance lifecycle, allocations and ownership records |
| 6 | Trading & Liquidity | Primary/secondary trading workflows and liquidity intelligence |
| 7 | Settlement Operations | Instructions, adapters, confirmations, idempotency and settlement state |
| 8 | Corporate Actions & Servicing | Interest, dividends, principal, fees, maturity and allocations |
| 9 | Investor Reporting | Statements, portfolio reports, cash-flow reporting and exports |
| 10 | Continuous Intelligence | Scheduled monitoring, signals, anomaly detection and escalation |
| 11 | Governance & Audit | Governance reviews, audit trail, waivers and control evidence |
| 12 | Institutional Access & Identity | Organization membership, roles, access policy and access events |
| 13 | Institutional Operations | Workflows, tasks, exceptions, SLAs and operational queues |
| 14 | Event Orchestration | Rules, event ledger and event-to-workflow automation |
| 15 | Decisioning & Approvals | Approval policies, segregation of duties, decision records and evidence |
| 16 | Evidence & Audit Intelligence | Evidence graph linking source documents, events, decisions and outcomes |
| 17 | Policy & Control Plane | Versioned policies, rule evaluation, control tests and policy exceptions |
| 18 | Institutional Data Room | Permissioned diligence rooms, evidence packages and controlled sharing |
| 19 | Counterparty & Relationship Intelligence | Counterparty profiles, exposure, relationship history and concentration |
| 20 | Valuation & Scenario Engine | Valuation models, assumptions, sensitivities and scenario analysis |
| 21 | Treasury & Cash Management | Cash positions, funding, liquidity forecasts and payment controls |
| 22 | Risk Aggregation | Cross-asset risk, concentration, stress testing and portfolio limits |
| 23 | Compliance Operations | Case management, regulatory workflows, attestations and remediation |
| 24 | Institutional Workflow Automation | Multi-step agentic workflows with human checkpoints and approvals |
| 25 | Institutional AI Copilot | Context-aware research, drafting, explanations and controlled actions |
| 26 | Marketplace & Distribution | Institutional discovery, eligibility, allocations and distribution workflows |
| 27 | Custody & Ownership | Custody integrations, ownership reconciliation and transfer controls |
| 28 | Multi-Rail Payments | Bank/stablecoin/CBDC payment orchestration and reconciliation |
| 29 | Reconciliation & Finance Ops | Subledger, reconciliation, breaks, fees and accounting exports |
| 30 | Institutional Analytics | Executive analytics, KPIs, attribution, benchmarking and performance |
| 31 | Governance, Security & Resilience | Defense-in-depth, immutable audit, DR, observability and controls |
| 32 | Institutional Network | Identity-aware counterparties, permissions and secure institutional connectivity |
| 33 | Global Regulatory Expansion | Jurisdiction packs, rulesets and market-specific compliance configuration |
| 34 | Institutional Liquidity Network | Connected liquidity venues, routing, pricing and execution intelligence |
| 35 | Autonomous Institutional Operations | Policy-bounded automation with continuous human oversight |

## Cross-phase architecture
- **Experience:** Next.js + TypeScript + Stitch institutional UI.
- **Identity:** Supabase Auth; organization-scoped authorization and RLS.
- **System of record:** PostgreSQL/Supabase with append-oriented event/audit records.
- **AI:** extraction, classification, risk explanation, anomaly detection, research and workflow assistance; never bypasses authorization.
- **Workflow:** operational workflows/tasks/exceptions → event rules/triggers → decision requests/approvals.
- **Financial rails:** adapter interfaces for bank rails, stablecoins, Ethereum, Polygon and future rails.
- **Documents/evidence:** object storage + normalized metadata + vector retrieval + evidence lineage.
- **Backend:** NestJS/TypeScript API with Python services where model workloads require them; Redis/queue workers for asynchronous processing.
- **Observability:** structured logs, health checks, metrics, security events and operational telemetry.

## Completion standard
A phase is not considered complete merely because a screen or table exists. It must have: (1) persisted domain model, (2) organization isolation/RLS, (3) authenticated authorization, (4) deterministic service/API behavior, (5) UI state and error handling, (6) audit/evidence coverage where applicable, (7) idempotency for externally triggered actions, (8) tests, and (9) deployment/observability hooks.

## Current consolidation target
Bring phases 1–35 behind a single institutional control plane rather than continuing to add disconnected tabs. Existing Phase 1–15 modules are retained and progressively wired into the shared workflow/event/decision architecture. Phases 16–35 are defined here as the target build sequence and should be implemented as domain modules, not placeholder marketing pages.
