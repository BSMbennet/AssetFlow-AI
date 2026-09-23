'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Users, KeyRound, Activity, UserPlus, Lock, RefreshCw, UserCog, Ban } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Member = { id:string; user_id:string; role:string; status:string; last_seen_at:string|null };
type Policy = { id:string; name:string; resource:string; action:string; effect:string; role:string; enabled:boolean };
type Event = { id:string; event_type:string; resource:string|null; action:string|null; outcome:string; created_at:string };
type Invitation = { id:string; email:string; role:string; status:string; expires_at:string; created_at:string };

const ROLES = ['ADMIN','OPERATOR','COMPLIANCE','ANALYST','INVESTOR'] as const;
const STATUSES = ['ACTIVE','INACTIVE','SUSPENDED'] as const;

export function Phase12AccessWorkspace() {
 const [members,setMembers]=useState<Member[]>([]);
 const [policies,setPolicies]=useState<Policy[]>([]);
 const [events,setEvents]=useState<Event[]>([]);
 const [invitations,setInvitations]=useState<Invitation[]>([]);
 const [org,setOrg]=useState<string|null>(null);
 const [myRole,setMyRole]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState<string|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [inviteEmail,setInviteEmail]=useState('');
 const [inviteRole,setInviteRole]=useState<string>('INVESTOR');

 async function load(){
  setLoading(true); setError(null);
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setError('Sign in required');setLoading(false);return;}
  const {data:profile,error:profileError}=await supabase.from('profiles').select('organization_id').eq('id',user.id).maybeSingle();
  if(profileError||!profile?.organization_id){setError(profileError?.message||'No organization is assigned to this account');setLoading(false);return;}
  setOrg(profile.organization_id);
  await supabase.rpc('bootstrap_access_member');
  const {data:me}=await supabase.from('organization_members').select('role,status').eq('organization_id',profile.organization_id).eq('user_id',user.id).maybeSingle();
  setMyRole(me?.status==='ACTIVE'?me.role:null);
  const [m,p,e,i]=await Promise.all([
   supabase.from('organization_members').select('id,user_id,role,status,last_seen_at').eq('organization_id',profile.organization_id).order('created_at',{ascending:false}),
   supabase.from('access_policies').select('id,name,resource,action,effect,role,enabled').eq('organization_id',profile.organization_id).order('created_at',{ascending:false}),
   supabase.from('access_events').select('id,event_type,resource,action,outcome,created_at').eq('organization_id',profile.organization_id).order('created_at',{ascending:false}).limit(12),
   supabase.from('access_invitations').select('id,email,role,status,expires_at,created_at').eq('organization_id',profile.organization_id).order('created_at',{ascending:false}).limit(10)
  ]);
  const firstError=m.error||p.error||e.error||i.error;
  if(firstError)setError(firstError.message);
  else {setMembers((m.data||[]) as Member[]);setPolicies((p.data||[]) as Policy[]);setEvents((e.data||[]) as Event[]);setInvitations((i.data||[]) as Invitation[]);}
  setLoading(false);
 }
 useEffect(()=>{load()},[]);

 const canManage=myRole==='OWNER'||myRole==='ADMIN';
 const active=members.filter(m=>m.status==='ACTIVE').length;
 const denied=events.filter(e=>e.outcome==='DENIED').length;

 async function logEvent(eventType:string,resource:string,action:string,outcome:'ALLOWED'|'DENIED'){
  if(!org)return;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return;
  await supabase.from('access_events').insert({organization_id:org,user_id:user.id,event_type:eventType,resource,action,outcome,metadata:{source:'phase12-ui'}});
 }

 async function updateMember(member:Member, patch:Partial<Pick<Member,'role'|'status'>>){
  if(!canManage)return;
  setBusy(member.id); setError(null);
  const {error:e}=await supabase.from('organization_members').update(patch).eq('id',member.id);
  if(e){setError(e.message);await logEvent('MEMBER_CHANGE',`member:${member.id}`,Object.keys(patch).join(','),'DENIED');}
  else {await logEvent('MEMBER_CHANGE',`member:${member.id}`,Object.keys(patch).join(','),'ALLOWED'); await load();}
  setBusy(null);
 }

 async function togglePolicy(policy:Policy){
  if(!canManage)return;
  setBusy(policy.id); setError(null);
  const {error:e}=await supabase.from('access_policies').update({enabled:!policy.enabled,updated_at:new Date().toISOString()}).eq('id',policy.id);
  if(e){setError(e.message);await logEvent('POLICY_CHANGE',`policy:${policy.id}`,'TOGGLE','DENIED');}
  else {await logEvent('POLICY_CHANGE',`policy:${policy.id}`,'TOGGLE','ALLOWED');await load();}
  setBusy(null);
 }

 async function createInvitation(){
  if(!canManage||!org)return;
  const email=inviteEmail.trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email)){setError('Enter a valid work email address');return;}
  setBusy('invite');setError(null);
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setError('Sign in required');setBusy(null);return;}
  const {error:e}=await supabase.from('access_invitations').insert({organization_id:org,email,role:inviteRole,invited_by:user.id});
  if(e)setError(e.message);
  else {setInviteEmail('');await logEvent('INVITATION_CREATED',email,'CREATE','ALLOWED');await load();}
  setBusy(null);
 }

 return <main className="mx-auto max-w-[1540px] space-y-6 p-4 md:p-8">
  <section className="assetflow-command rounded-3xl p-6 md:p-8">
   <div className="relative z-10">
    <div className="mb-3 flex flex-wrap items-center gap-2"><span className="assetflow-eyebrow">Phase 12 · Institutional Access</span><span className="assetflow-status"><span className="assetflow-live-dot"/> Access control online</span></div>
    <h1 className="font-display text-3xl font-semibold tracking-[-.04em] text-white md:text-5xl">Control who can act on institutional assets.</h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Organization-scoped identity, role lifecycle, policy controls and access telemetry with authorization enforced at the data layer.</p>
   </div>
  </section>

  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
   <K label="Active members" value={String(active)} icon={Users}/>
   <K label="Policies" value={String(policies.length)} icon={Lock}/>
   <K label="Access events" value={String(events.length)} icon={Activity}/>
   <K label="Denied events" value={String(denied)} icon={ShieldCheck}/>
  </div>

  {error&&<div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200">{error}</div>}

  <div className="grid gap-6 lg:grid-cols-2">
   <Panel title="Organization members" icon={Users} action={<button onClick={load} disabled={loading} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-40"><RefreshCw className="h-4 w-4"/></button>}>
    <div className="space-y-2">
     {!loading&&!members.length&&<Empty text="No organization members yet. Apply the Phase 12 migration and seed the first owner."/>}
     {members.map(m=><div key={m.id} className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">
      <div className="flex items-start justify-between gap-3">
       <div><p className="font-mono text-xs text-slate-300">{m.user_id.slice(0,8)}…</p><p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">{m.role} · {m.status}</p></div>
       <span className="rounded-full border border-cyan-400/20 px-2 py-1 text-[9px] text-cyan-300">{m.last_seen_at?'Seen':'Never seen'}</span>
      </div>
      {canManage&&<div className="mt-3 flex flex-wrap gap-2">
       <select value={m.role} disabled={busy===m.id} onChange={e=>updateMember(m,{role:e.target.value})} className="rounded-lg border border-white/[.08] bg-black/20 px-2 py-1.5 text-[10px] text-slate-300"><option value="OWNER">OWNER</option>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</select>
       <select value={m.status} disabled={busy===m.id} onChange={e=>updateMember(m,{status:e.target.value})} className="rounded-lg border border-white/[.08] bg-black/20 px-2 py-1.5 text-[10px] text-slate-300">{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select>
      </div>}
     </div>)}
    </div>
   </Panel>

   <Panel title="Invite institutional users" icon={UserPlus}>
    {canManage?<div className="space-y-3">
      <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="operator@institution.com" className="w-full rounded-xl border border-white/[.08] bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/30"/>
      <div className="flex gap-2">
       <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} className="flex-1 rounded-xl border border-white/[.08] bg-black/20 px-3 py-2.5 text-xs text-slate-300">{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</select>
       <button onClick={createInvitation} disabled={busy==='invite'} className="assetflow-primary px-4 py-2.5 text-xs">{busy==='invite'?'Queueing…':'Create invitation'}</button>
      </div>
      <p className="text-[10px] leading-5 text-slate-600">Creates an organization-scoped invitation record. Delivery through the identity provider remains a separate server-side step.</p>
      <div className="space-y-2">{invitations.map(i=><div key={i.id} className="flex items-center justify-between rounded-xl border border-white/[.06] bg-white/[.02] p-3"><div><p className="text-xs text-slate-300">{i.email}</p><p className="mt-1 font-mono text-[9px] text-slate-600">{i.role} · expires {new Date(i.expires_at).toLocaleDateString()}</p></div><span className="text-[9px] uppercase text-cyan-300">{i.status}</span></div>)}</div>
    </div>:<Empty text="Only OWNER and ADMIN members can create invitations."/>}
   </Panel>
  </div>

  <Panel title="Access policies" icon={KeyRound}>
   <div className="grid gap-2 md:grid-cols-2">
    {!loading&&!policies.length&&<Empty text="No custom policies configured."/>}
    {policies.map(p=><div key={p.id} className="rounded-xl border border-white/[.06] bg-white/[.02] p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-slate-200">{p.name}</p><button disabled={!canManage||busy===p.id} onClick={()=>togglePolicy(p)} className={`rounded-full border px-2 py-1 text-[9px] ${p.enabled?'border-emerald-400/20 text-emerald-300':'border-slate-600 text-slate-500'}`}>{p.enabled?'ENABLED':'DISABLED'}</button></div><p className="mt-1 font-mono text-[10px] text-slate-600">{p.role} · {p.resource}:{p.action} · {p.effect}</p></div>)}
   </div>
  </Panel>

  <Panel title="Recent access telemetry" icon={Activity} action={<span className="font-mono text-[9px] text-slate-600">LAST 12 EVENTS</span>}>
   <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-white/[.06] text-[9px] uppercase tracking-[.16em] text-slate-600"><th className="py-3">Event</th><th>Resource</th><th>Outcome</th><th>Time</th></tr></thead><tbody>{events.map(e=><tr key={e.id} className="border-b border-white/[.04] text-xs text-slate-400"><td className="py-3 font-mono">{e.event_type}</td><td>{e.resource||'—'} {e.action?`· ${e.action}`:''}</td><td className={e.outcome==='DENIED'?'text-rose-300':'text-emerald-300'}>{e.outcome}</td><td className="font-mono text-[10px]">{new Date(e.created_at).toLocaleString()}</td></tr>)}</tbody></table>{!loading&&!events.length&&<Empty text="No access events recorded yet."/>}</div>
  </Panel>
  <div className="flex items-center gap-2 text-xs text-slate-600"><UserCog className="h-4 w-4"/> Role and policy mutations are blocked by Postgres RLS for non-administrators. <Ban className="ml-2 h-4 w-4"/> Denied decisions are recorded when a mutation is rejected.</div>
 </main>
}

function K({label,value,icon:Icon}:{label:string;value:string;icon:LucideIcon}){return <div className="assetflow-kpi"><p>{label}</p><strong>{value}</strong><span><Icon className="mr-1 inline h-3 w-3"/> organization scoped</span></div>}
function Panel({title,icon:Icon,action,children}:{title:string;icon:LucideIcon;action?:React.ReactNode;children:React.ReactNode}){return <section className="assetflow-panel rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-display text-sm font-semibold text-white"><Icon className="h-4 w-4 text-cyan-300"/>{title}</h2>{action}</div>{children}</section>}
function Empty({text}:{text:string}){return <div className="py-8 text-center text-xs text-slate-600">{text}</div>}
