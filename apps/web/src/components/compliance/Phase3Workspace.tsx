'use client';

import { Activity, ArrowRight, Bot, CheckCircle2, FileCheck2, LockKeyhole, Radar, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import ComplianceDashboard from './ComplianceDashboard';
import { HumanApprovalWorkspace } from './HumanApprovalWorkspace';

const stages = [
  { label: 'Asset intake', detail: 'Documents and borrower data', icon: FileCheck2 },
  { label: 'Risk baseline', detail: 'Explainable exposure scoring', icon: Radar },
  { label: 'Compliance', detail: 'KYC, AML and controls', icon: ShieldCheck },
  { label: 'Human approval', detail: 'Reviewer decision and audit trail', icon: UsersRound },
];

export function Phase3Workspace() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-0 h-96 w-96 rounded-full bg-cyan-400/[0.06] blur-3xl" />
        <div className="absolute right-[5%] top-[18%] h-96 w-96 rounded-full bg-violet-500/[0.05] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-cyan-400/[0.04] p-6 md:p-8">
          <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" /> Phase 3 · Risk + Compliance
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Decision-grade asset readiness.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 md:text-base">
                AssetFlow turns portfolio data into an explainable risk baseline, a compliance control set and a human approval workflow — without hiding the reasoning behind the decision.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[520px]">
              {[
                ['Explainable', 'risk'],
                ['Connected', 'controls'],
                ['Human-led', 'approval'],
                ['Auditable', 'decisions'],
              ].map(([title, subtitle]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/35">{subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Readiness pipeline</p>
              <p className="mt-1 text-sm text-white/65">From raw asset data to a reviewable institutional decision.</p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-300 sm:flex">
              <Activity className="h-3.5 w-3.5" /> Phase active
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <div key={stage.label} className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.05] text-cyan-200">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{stage.label}</p>
                    <p className="truncate text-[11px] text-white/35">{stage.detail}</p>
                  </div>
                  {index < stages.length - 1 && <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 text-white/20 xl:block" />}
                </div>
              );
            })}
          </div>
        </section>

        <ComplianceDashboard />

        <section className="my-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <LockKeyhole className="h-5 w-5 text-cyan-300" />
            <h2 className="mt-4 text-base font-semibold">Controlled by policy</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">Compliance checks are recorded against the asset instead of living only in a spreadsheet or analyst inbox.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <Bot className="h-5 w-5 text-violet-300" />
            <h2 className="mt-4 text-base font-semibold">AI-assisted, not AI-approved</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">Risk recommendations support the reviewer while keeping the final decision inside a human approval workflow.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <h2 className="mt-4 text-base font-semibold">Ready for the next milestone</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">This foundation is designed to extend into continuous monitoring and institutional workflows.</p>
          </div>
        </section>

        <HumanApprovalWorkspace />
      </div>
    </div>
  );
}
