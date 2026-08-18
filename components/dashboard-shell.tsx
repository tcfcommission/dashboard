"use client";

import { CSSProperties, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Banknote, BarChart3, Bot, BriefcaseBusiness, CalendarDays,
  Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, Command, ExternalLink,
  Camera, Goal as GoalIcon, KeyRound, Layers3, Link2, ListTodo, LoaderCircle, LogOut, Menu,
  MoreHorizontal, Plus, RefreshCw, Search, Settings2, Smartphone, Sparkles, Target,
  Trash2, TrendingUp, Users, Video, WalletCards, X, Zap
} from "lucide-react";
import type { DashboardData, Integration, Task } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type View = "command" | "tasks" | "money" | "socials" | "goals" | "integrations" | "activity" | "account";
type ModalMode = "task" | "goal" | "social" | "business" | "transaction" | "integration" | null;

const nav: Array<{ id: View; label: string; icon: typeof Command }> = [
  { id: "command", label: "Command", icon: Command },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "money", label: "Money", icon: CircleDollarSign },
  { id: "socials", label: "Socials", icon: Users },
  { id: "goals", label: "Goals", icon: Target },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "account", label: "Account", icon: Settings2 }
];

const providerDetails: Record<string, { name: string; description: string; icon: typeof Link2; availability: string }> = {
  stripe: { name: "Stripe", description: "Payments, fees, refunds and revenue history.", icon: CircleDollarSign, availability: "Ready" },
  youtube: { name: "YouTube", description: "Subscribers, views and channel performance.", icon: Video, availability: "Ready" },
  tiktok: { name: "TikTok", description: "Followers and likes after TikTok app approval.", icon: Smartphone, availability: "OAuth approval" },
  instagram: { name: "Instagram", description: "Professional account reach through Meta.", icon: Camera, availability: "Meta approval" },
  open_banking: { name: "Open Banking", description: "Bank feeds through an approved provider.", icon: Banknote, availability: "Provider required" },
  custom: { name: "Custom API", description: "Normalized webhook for n8n, Make or another API.", icon: Zap, availability: "Webhook ready" }
};

function money(value: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);
}
function number(value: number) { return new Intl.NumberFormat("en-GB", { notation: value > 9999 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value || 0); }
function date(value: string | null) { return value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "Not scheduled"; }
function relative(value: string | null) {
  if (!value) return "Never";
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(seconds) < 3600) return formatter.format(Math.round(seconds / 60), "minute");
  if (Math.abs(seconds) < 86400) return formatter.format(Math.round(seconds / 3600), "hour");
  return formatter.format(Math.round(seconds / 86400), "day");
}

async function api(path: string, options?: RequestInit) {
  const response = await fetch(path, { ...options, headers: { "content-type": "application/json", ...(options?.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload;
}

export function DashboardShell({ initialData, email, setupError }: { initialData: DashboardData; email: string; setupError?: string }) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<View>("command");
  const [modal, setModal] = useState<ModalMode>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(setupError ? { type: "error", text: setupError } : null);
  const [navOpen, setNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const totals = useMemo(() => {
    const income = data.transactions.filter((item) => item.transaction_type !== "expense").reduce((sum, item) => sum + Number(item.net_amount), 0);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const month = data.transactions.filter((item) => new Date(item.occurred_at) >= monthStart).reduce((sum, item) => sum + Number(item.net_amount), 0);
    return {
      income,
      month,
      followers: data.socials.reduce((sum, item) => sum + Number(item.followers), 0),
      openTasks: data.tasks.filter((item) => item.status !== "done").length,
      connected: data.integrations.filter((item) => item.status === "connected" && item.is_enabled).length
    };
  }, [data]);

  async function reload(message?: string) {
    const payload = await api("/api/dashboard");
    setData(payload.data);
    if (message) setNotice({ type: "success", text: message });
  }

  async function mutate(resource: string, id: string, body: Record<string, unknown>) {
    setBusy(id);
    try {
      await api(`/api/resources/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      await reload("Saved.");
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Update failed." }); }
    finally { setBusy(null); }
  }

  async function remove(resource: string, id: string) {
    if (!window.confirm("Remove this item? This cannot be undone.")) return;
    setBusy(id);
    try {
      await api(`/api/resources/${resource}/${id}`, { method: "DELETE" });
      await reload("Removed.");
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Delete failed." }); }
    finally { setBusy(null); }
  }

  async function sync(integration: Integration) {
    setBusy(integration.id);
    try {
      await api("/api/integrations/sync", { method: "POST", body: JSON.stringify({ integrationId: integration.id }) });
      await reload(`${integration.label} synced.`);
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Sync failed." }); }
    finally { setBusy(null); }
  }

  const current = nav.find((item) => item.id === view)!;
  const mission = data.tasks.find((item) => item.status !== "done" && item.priority === "high") || data.tasks.find((item) => item.status !== "done");

  return (
    <div className="dashboard-frame">
      <aside className={`sidebar ${navOpen ? "open" : ""}`}>
        <div className="sidebar-brand"><div className="brand-mark small"><span /></div><div><strong>TCF OS</strong><small>Personal command</small></div><button className="mobile-close" onClick={() => setNavOpen(false)}><X size={20} /></button></div>
        <div className="system-pill"><span /> System online</div>
        <nav>
          <p className="nav-label">Operate</p>
          {nav.slice(0, 5).map((item) => <NavButton key={item.id} item={item} active={view === item.id} onClick={() => { setView(item.id); setNavOpen(false); }} />)}
          <p className="nav-label">System</p>
          {nav.slice(5).map((item) => <NavButton key={item.id} item={item} active={view === item.id} onClick={() => { setView(item.id); setNavOpen(false); }} />)}
        </nav>
        <div className="sidebar-foot">
          <div className="owner-card"><div className="avatar">TC</div><div><strong>{data.profile.display_name}</strong><small>{email}</small></div></div>
          <form action="/api/auth/logout" method="post"><button className="logout-button"><LogOut size={16} /> Sign out</button></form>
        </div>
      </aside>
      {navOpen && <button className="nav-scrim" onClick={() => setNavOpen(false)} aria-label="Close navigation" />}

      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-title"><button className="menu-button" onClick={() => setNavOpen(true)}><Menu /></button><div><h1>{current.label}</h1><p>TCF OS · {view === "command" ? "operator overview" : view}</p></div></div>
          <div className="topbar-actions">
            <button className="search-box" onClick={() => { setCommandQuery(""); setCommandOpen(true); }}><Search size={16} /><span>Search command centre</span><kbd>⌘K</kbd></button>
            <button className="ghost-button" onClick={() => reload("Dashboard refreshed.")}><RefreshCw size={16} /> Refresh</button>
            <button className="primary-button" onClick={() => setModal("task")}><Plus size={17} /> New task</button>
          </div>
        </header>

        <div className="dashboard-content">
          {notice && <div className={`notice ${notice.type}`}><span>{notice.text}</span><button onClick={() => setNotice(null)}><X size={16} /></button></div>}
          {setupError && <SetupState error={setupError} />}
          {!setupError && view === "command" && <CommandView data={data} totals={totals} mission={mission} setModal={setModal} mutate={mutate} setView={setView} busy={busy} greeting={greeting} />}
          {!setupError && view === "tasks" && <TasksView data={data} mutate={mutate} remove={remove} busy={busy} onAdd={() => setModal("task")} />}
          {!setupError && view === "money" && <MoneyView data={data} totals={totals} onAddBusiness={() => setModal("business")} onAddTransaction={() => setModal("transaction")} remove={remove} busy={busy} />}
          {!setupError && view === "socials" && <SocialsView data={data} onAdd={() => setModal("social")} remove={remove} busy={busy} />}
          {!setupError && view === "goals" && <GoalsView data={data} onAdd={() => setModal("goal")} remove={remove} busy={busy} />}
          {!setupError && view === "integrations" && <IntegrationsView data={data} onAdd={() => setModal("integration")} sync={sync} mutate={mutate} remove={remove} busy={busy} />}
          {!setupError && view === "activity" && <ActivityView data={data} />}
          {!setupError && view === "account" && <AccountView email={email} setNotice={setNotice} />}
        </div>
      </main>

      <nav className="mobile-nav">{nav.slice(0, 5).map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><Icon size={19} /><span>{item.label}</span></button>; })}</nav>
      {commandOpen && <CommandPalette query={commandQuery} setQuery={setCommandQuery} onClose={() => setCommandOpen(false)} onView={(next) => { setView(next); setCommandOpen(false); }} onCreate={(next) => { setModal(next); setCommandOpen(false); }} />}
      {modal && <CreateModal mode={modal} businesses={data.businesses} onClose={() => setModal(null)} onCreated={async () => { setModal(null); await reload("Added to command centre."); }} setNotice={setNotice} />}
    </div>
  );
}

function NavButton({ item, active, onClick }: { item: (typeof nav)[number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}><Icon size={18} /><span>{item.label}</span>{item.id === "integrations" && <span className="nav-dot" />}</button>;
}

function SetupState({ error }: { error: string }) {
  return <section className="setup-state"><div className="setup-icon"><Settings2 /></div><p className="eyebrow">Configuration required</p><h2>The new secure foundation is ready for connection.</h2><p>{error}</p><ol><li>Connect the TCF Supabase project.</li><li>Run the production migration.</li><li>Add the publishable and server-only variables in Vercel.</li><li>Create the owner user in Supabase Auth, then redeploy.</li></ol><small>No secrets should ever be pasted into the browser or committed to GitHub.</small></section>;
}

function CommandView({ data, totals, mission, setModal, mutate, setView, busy, greeting }: { data: DashboardData; totals: { income: number; month: number; followers: number; openTasks: number; connected: number }; mission?: Task; setModal: (mode: ModalMode) => void; mutate: (r: string, id: string, b: Record<string, unknown>) => void; setView: (view: View) => void; busy: string | null; greeting: string }) {
  return <>
    <section className="hero"><div><p className="eyebrow">{new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p><h2>{greeting}, {data.profile.display_name}.</h2><p>Your operation is live. Focus on the next move, then let the system carry the repetition.</p></div><div className="hero-actions"><button className="ghost-button" onClick={() => setModal("integration")}><Link2 size={17} /> Connect source</button><button className="primary-button" onClick={() => setModal("transaction")}><Plus size={17} /> Record money</button></div></section>
    <section className="kpi-grid">
      <Kpi label="Net money tracked" value={money(totals.income, data.profile.base_currency)} detail={`${data.transactions.length} transactions`} icon={<WalletCards />} />
      <Kpi label="This month" value={money(totals.month, data.profile.base_currency)} detail="Net across sources" icon={<TrendingUp />} />
      <Kpi label="Audience" value={number(totals.followers)} detail={`${data.socials.length} accounts`} icon={<Users />} />
      <Kpi label="Open actions" value={String(totals.openTasks)} detail={`${totals.connected} live integrations`} icon={<ListTodo />} />
    </section>
    <section className="command-grid">
      <div className="panel wide"><PanelHead title="Revenue pulse" meta="Last 30 recorded days" action={<button onClick={() => setView("money")}>Open money <ChevronRight size={15} /></button>} /><RevenueChart data={data.dailyRevenue} /></div>
      <div className="panel mission-panel"><p className="eyebrow">Today’s mission</p>{mission ? <><h3>{mission.title}</h3><p>{mission.details || "Move this one item forward before opening another lane."}</p><div className="mission-meta"><span className={`priority ${mission.priority}`}>{mission.priority}</span><span><Clock3 size={14} /> {date(mission.due_date)}</span></div><button className="primary-button full" disabled={busy === mission.id} onClick={() => mutate("tasks", mission.id, { status: "done", completed_at: new Date().toISOString() })}>{busy === mission.id ? <LoaderCircle className="spin" /> : <Check />} Complete mission</button></> : <Empty icon={<Sparkles />} title="Clear runway" text="Add one high-priority task to define today’s mission." action={<button className="primary-button" onClick={() => setModal("task")}><Plus size={16} /> Add mission</button>} />}</div>
      <div className="panel wide"><PanelHead title="Operating queue" meta={`${totals.openTasks} open`} action={<button onClick={() => setView("tasks")}>View all <ChevronRight size={15} /></button>} /><div className="compact-list">{data.tasks.filter((task) => task.status !== "done").slice(0, 5).map((task) => <TaskRow key={task.id} task={task} busy={busy === task.id} onComplete={() => mutate("tasks", task.id, { status: "done", completed_at: new Date().toISOString() })} />)}{!data.tasks.some((task) => task.status !== "done") && <Empty icon={<ListTodo />} title="No open tasks" text="The queue is clear." />}</div></div>
      <div className="panel"><PanelHead title="System health" meta={`${totals.connected}/${data.integrations.length} online`} /><div className="health-list">{data.integrations.slice(0, 5).map((integration) => <div key={integration.id}><span className={`status-dot ${integration.status}`} /><div><strong>{integration.label}</strong><small>{integration.last_error || `Last sync ${relative(integration.last_synced_at)}`}</small></div><span className={`status-badge ${integration.status}`}>{integration.status}</span></div>)}{!data.integrations.length && <Empty icon={<Link2 />} title="No sources connected" text="Add Stripe, YouTube or a custom webhook." />}</div></div>
    </section>
  </>;
}

function Kpi({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) { return <article className="kpi"><div className="kpi-top"><span>{label}</span><div>{icon}</div></div><strong>{value}</strong><small>{detail}</small></article>; }
function PanelHead({ title, meta, action }: { title: string; meta?: string; action?: ReactNode }) { return <div className="panel-head"><div><h3>{title}</h3>{meta && <span>{meta}</span>}</div>{action}</div>; }
function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) { return <div className="empty-state"><div>{icon}</div><strong>{title}</strong><p>{text}</p>{action}</div>; }

function RevenueChart({ data }: { data: DashboardData["dailyRevenue"] }) {
  if (!data.length) return <Empty icon={<BarChart3 />} title="No revenue history yet" text="Stripe syncs and normalized webhooks will build this chart automatically." />;
  const values = data.map((item) => Number(item.revenue));
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 700},${190 - (value / max) * 155}`).join(" ");
  const total = values.reduce((sum, value) => sum + value, 0);
  return <div className="revenue-chart"><div className="chart-total"><span>Recorded net</span><strong>{money(total)}</strong></div><svg viewBox="0 0 700 210" preserveAspectRatio="none" aria-label="Revenue trend"><defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".22"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient></defs><path d={`M ${points.replaceAll(" ", " L ")} L 700 210 L 0 210 Z`} fill="url(#chart-fill)"/><polyline points={points} fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /></svg><div className="chart-labels"><span>{date(data[0].metric_date)}</span><span>{date(data[data.length - 1].metric_date)}</span></div></div>;
}

function TaskRow({ task, busy, onComplete, onDelete }: { task: Task; busy: boolean; onComplete: () => void; onDelete?: () => void }) {
  return <div className={`task-row ${task.status === "done" ? "done" : ""}`}><button className="task-check" onClick={onComplete} disabled={busy || task.status === "done"}>{task.status === "done" ? <Check size={16} /> : busy ? <LoaderCircle className="spin" size={16} /> : null}</button><div><strong>{task.title}</strong><small>{task.details || "No notes"}</small></div><span className={`priority ${task.priority}`}>{task.priority}</span><span className="row-date">{date(task.due_date)}</span>{onDelete && <button className="icon-button danger" onClick={onDelete}><Trash2 size={16} /></button>}</div>;
}

function TasksView({ data, mutate, remove, busy, onAdd }: { data: DashboardData; mutate: (r: string, id: string, b: Record<string, unknown>) => void; remove: (r: string, id: string) => void; busy: string | null; onAdd: () => void }) {
  return <PageSection eyebrow="Execution" title="One queue. No loose ends." text="Prioritise the work, complete it, and keep a clean operating rhythm." action={<button className="primary-button" onClick={onAdd}><Plus size={17}/> Add task</button>}><div className="panel"><div className="task-board">{data.tasks.map((task) => <TaskRow key={task.id} task={task} busy={busy === task.id} onComplete={() => mutate("tasks", task.id, { status: task.status === "done" ? "todo" : "done", completed_at: task.status === "done" ? null : new Date().toISOString() })} onDelete={() => remove("tasks", task.id)} />)}{!data.tasks.length && <Empty icon={<ListTodo />} title="Nothing in the queue" text="Add your first task or daily mission." action={<button className="primary-button" onClick={onAdd}><Plus size={16}/> Add task</button>} />}</div></div></PageSection>;
}

function MoneyView({ data, totals, onAddBusiness, onAddTransaction, remove, busy }: { data: DashboardData; totals: { income: number; month: number }; onAddBusiness: () => void; onAddTransaction: () => void; remove: (r: string, id: string) => void; busy: string | null }) {
  return <PageSection eyebrow="Finance" title="Know where every pound moves." text="Manual entries, Stripe and future bank feeds all land in one normalized ledger." action={<><button className="ghost-button" onClick={onAddBusiness}><BriefcaseBusiness size={17}/> Add business</button><button className="primary-button" onClick={onAddTransaction}><Plus size={17}/> Add transaction</button></>}>
    <section className="kpi-grid two"><Kpi label="Tracked net" value={money(totals.income, data.profile.base_currency)} detail="All recorded sources" icon={<WalletCards/>}/><Kpi label="Current month" value={money(totals.month, data.profile.base_currency)} detail="Net movement" icon={<TrendingUp/>}/></section>
    <div className="split-grid"><div className="panel"><PanelHead title="Businesses" meta={`${data.businesses.length} entities`} /><div className="entity-list">{data.businesses.map((business) => <div key={business.id} className="entity-row"><div className="entity-icon">{business.emoji}</div><div><strong>{business.name}</strong><small>{business.source} · {business.currency}</small></div><span className={`status-badge ${business.is_active ? "connected" : "disconnected"}`}>{business.is_active ? "active" : "paused"}</span><button className="icon-button danger" disabled={busy === business.id} onClick={() => remove("businesses", business.id)}><Trash2 size={15}/></button></div>)}{!data.businesses.length && <Empty icon={<BriefcaseBusiness/>} title="No businesses" text="Add the businesses whose money you want to track." />}</div></div>
    <div className="panel"><PanelHead title="Latest transactions" meta={`${data.transactions.length} shown`} /><div className="ledger">{data.transactions.map((transaction) => <div key={transaction.id}><div className={`money-icon ${transaction.net_amount < 0 ? "out" : "in"}`}><ArrowUpRight size={17}/></div><div><strong>{transaction.description}</strong><small>{transaction.provider} · {date(transaction.occurred_at)}</small></div><b className={transaction.net_amount < 0 ? "negative" : "positive"}>{money(transaction.net_amount, transaction.currency)}</b><button className="icon-button danger" onClick={() => remove("transactions", transaction.id)}><Trash2 size={15}/></button></div>)}{!data.transactions.length && <Empty icon={<WalletCards/>} title="Ledger is empty" text="Record an item manually or connect Stripe." />}</div></div></div>
  </PageSection>;
}

function SocialsView({ data, onAdd, remove, busy }: { data: DashboardData; onAdd: () => void; remove: (r: string, id: string) => void; busy: string | null }) {
  return <PageSection eyebrow="Audience" title="Every channel, one signal." text="Manual numbers stay editable; approved APIs replace them automatically without changing the dashboard." action={<button className="primary-button" onClick={onAdd}><Plus size={17}/> Add account</button>}><div className="social-grid">{data.socials.map((social) => <article className="social-card" key={social.id}><div className="social-card-head"><div className="social-icon">{social.platform === "youtube" ? <Video/> : social.platform === "instagram" ? <Camera/> : <Smartphone/>}</div><div><strong>{social.platform}</strong><span>{social.handle}</span></div><span className={`source-pill ${social.source}`}>{social.source}</span></div><div className="social-metrics"><div><span>Followers</span><strong>{number(social.followers)}</strong></div><div><span>Views / likes</span><strong>{number(social.views)}</strong></div><div><span>Growth</span><strong className={social.growth >= 0 ? "positive" : "negative"}>{social.growth >= 0 ? "+" : ""}{social.growth}%</strong></div></div><div className="social-foot"><span>Updated {relative(social.last_synced_at)}</span>{social.profile_url && <a href={social.profile_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Open</a>}<button className="icon-button danger" disabled={busy === social.id} onClick={() => remove("socials", social.id)}><Trash2 size={15}/></button></div></article>)}{!data.socials.length && <Empty icon={<Users/>} title="No social accounts" text="Add a manual account or connect a supported provider." action={<button className="primary-button" onClick={onAdd}><Plus size={16}/> Add account</button>} />}</div></PageSection>;
}

function GoalsView({ data, onAdd, remove, busy }: { data: DashboardData; onAdd: () => void; remove: (r: string, id: string) => void; busy: string | null }) {
  return <PageSection eyebrow="Direction" title="Targets that update with the work." text="Link goals to tracked metrics as integrations come online." action={<button className="primary-button" onClick={onAdd}><Plus size={17}/> Add goal</button>}><div className="goal-grid">{data.goals.map((goal) => { const percent = Math.min(100, Math.round((Number(goal.current_value) / Math.max(Number(goal.target_value), 1)) * 100)); return <article className="goal-card" key={goal.id}><div className="goal-ring" style={{ "--progress": `${percent * 3.6}deg` } as CSSProperties}><span>{percent}%</span></div><div className="goal-body"><div><span className={`status-badge ${goal.status === "active" ? "connected" : "disconnected"}`}>{goal.status}</span><button className="icon-button danger" disabled={busy === goal.id} onClick={() => remove("goals", goal.id)}><Trash2 size={15}/></button></div><h3>{goal.name}</h3><p>{number(goal.current_value)} / {number(goal.target_value)} {goal.unit}</p><div className="progress"><span style={{ width: `${percent}%` }}/></div><small>{goal.due_date ? `Due ${date(goal.due_date)}` : goal.auto_source ? `Automatic · ${goal.auto_source}` : "Manual progress"}</small></div></article>; })}{!data.goals.length && <Empty icon={<GoalIcon/>} title="No active targets" text="Add the result you are moving toward." action={<button className="primary-button" onClick={onAdd}><Plus size={16}/> Add goal</button>} />}</div></PageSection>;
}

function IntegrationsView({ data, onAdd, sync, mutate, remove, busy }: { data: DashboardData; onAdd: () => void; sync: (i: Integration) => void; mutate: (r: string, id: string, b: Record<string, unknown>) => void; remove: (r: string, id: string) => void; busy: string | null }) {
  return <PageSection eyebrow="Automation layer" title="Connect once. Let the system repeat." text="Secrets stay in Vercel. This dashboard stores only account IDs, safe URLs and environment-variable references." action={<button className="primary-button" onClick={onAdd}><Plus size={17}/> Add integration</button>}>
    <div className="integration-summary"><div><span>Connected</span><strong>{data.integrations.filter((item) => item.status === "connected").length}</strong></div><div><span>Needs attention</span><strong>{data.integrations.filter((item) => item.status === "attention").length}</strong></div><div><span>Automatic</span><strong>{data.integrations.filter((item) => item.is_enabled).length}</strong></div></div>
    <div className="integration-grid">{data.integrations.map((integration) => { const detail = providerDetails[integration.provider] || providerDetails.custom; const Icon = detail.icon; return <article className="integration-card" key={integration.id}><div className="integration-head"><div className="integration-icon"><Icon/></div><div><h3>{integration.label}</h3><p>{detail.name} · {integration.account_reference || "No account reference"}</p></div><span className={`status-badge ${integration.status}`}>{integration.status}</span></div><p className="integration-description">{integration.last_error || detail.description}</p><div className="integration-meta"><span><Clock3 size={14}/> Last sync {relative(integration.last_synced_at)}</span><span><RefreshCw size={14}/> Every {integration.sync_frequency_minutes >= 1440 ? `${Math.round(integration.sync_frequency_minutes / 1440)}d` : `${Math.round(integration.sync_frequency_minutes / 60)}h`}</span></div><div className="integration-actions"><label className="switch"><input type="checkbox" checked={integration.is_enabled} onChange={(event) => mutate("integrations", integration.id, { is_enabled: event.target.checked, next_sync_at: event.target.checked ? new Date().toISOString() : null })}/><span/></label><span>Automatic</span><button className="ghost-button compact" disabled={busy === integration.id || !integration.is_enabled} onClick={() => sync(integration)}>{busy === integration.id ? <LoaderCircle className="spin" size={15}/> : <RefreshCw size={15}/>} Sync now</button><button className="icon-button danger" onClick={() => remove("integrations", integration.id)}><Trash2 size={15}/></button></div></article>; })}{!data.integrations.length && <Empty icon={<Zap/>} title="Automation starts here" text="Connect Stripe or YouTube now. TikTok, Instagram and banks require their official approval or provider consent." action={<button className="primary-button" onClick={onAdd}><Plus size={16}/> Add integration</button>} />}</div>
    <div className="panel catalog"><PanelHead title="Available connection paths" meta="No scraping or unsafe shortcuts"/><div className="catalog-grid">{Object.entries(providerDetails).map(([key, detail]) => { const Icon = detail.icon; return <div key={key}><div><Icon/></div><strong>{detail.name}</strong><p>{detail.description}</p><span>{detail.availability}</span></div>; })}</div></div>
  </PageSection>;
}

function ActivityView({ data }: { data: DashboardData }) { return <PageSection eyebrow="Audit trail" title="Every sync leaves evidence." text="Successes, skips and errors are recorded so automation never becomes invisible."><div className="panel"><div className="activity-list">{data.syncRuns.map((run) => <div key={run.id}><div className={`activity-icon ${run.status}`}>{run.status === "success" ? <CheckCircle2/> : run.status === "failed" ? <X/> : <RefreshCw/>}</div><div><strong>{run.provider} sync</strong><p>{run.error_message || (run.summary ? JSON.stringify(run.summary) : "Sync started")}</p></div><span>{relative(run.started_at)}</span></div>)}{!data.syncRuns.length && <Empty icon={<Activity/>} title="No automation runs yet" text="Runs appear here after a manual sync, cron or webhook event." />}</div></div></PageSection>; }

function AccountView({ email, setNotice }: { email: string; setNotice: (notice: { type: "success" | "error"; text: string }) => void }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 12) {
      setNotice({ type: "error", text: "Use at least 12 characters for your password." });
      return;
    }
    if (password !== confirmation) {
      setNotice({ type: "error", text: "The two passwords do not match." });
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirmation("");
      setNotice({ type: "success", text: "Your dashboard password has been saved." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Password update failed." });
    } finally {
      setSaving(false);
    }
  }

  return <PageSection eyebrow="Owner security" title="Your access, under your control." text="Use a secure email link today. Add or change your password here whenever you are ready.">
    <div className="account-grid">
      <div className="panel account-panel"><PanelHead title="Owner identity" meta="Authenticated account"/><div className="account-body"><div className="account-identity"><div className="avatar">TC</div><div><strong>TCF owner</strong><span>{email}</span></div></div><p>Only this authenticated Supabase account can read or change the command centre data.</p></div></div>
      <div className="panel account-panel"><PanelHead title="Set or change password" meta="Optional with email sign-in"/><form className="account-form" onSubmit={updatePassword}><Field label="New password"><input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters"/></Field><Field label="Confirm password"><input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Enter it again"/></Field><button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16}/> : <KeyRound size={16}/>} {saving ? "Saving password…" : "Save password"}</button></form></div>
    </div>
  </PageSection>;
}

function PageSection({ eyebrow, title, text, action, children }: { eyebrow: string; title: string; text: string; action?: ReactNode; children: ReactNode }) { return <><section className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{text}</p></div>{action && <div className="page-actions">{action}</div>}</section>{children}</>; }

function CommandPalette({ query, setQuery, onClose, onView, onCreate }: { query: string; setQuery: (value: string) => void; onClose: () => void; onView: (view: View) => void; onCreate: (mode: Exclude<ModalMode, null>) => void }) {
  const actions: Array<{ label: string; group: string; icon: typeof Command; run: () => void }> = [
    ...nav.map((item) => ({ label: `Open ${item.label}`, group: "Navigate", icon: item.icon, run: () => onView(item.id) })),
    { label: "Create task", group: "Create", icon: ListTodo, run: () => onCreate("task") },
    { label: "Record transaction", group: "Create", icon: WalletCards, run: () => onCreate("transaction") },
    { label: "Add social account", group: "Create", icon: Users, run: () => onCreate("social") },
    { label: "Connect integration", group: "Create", icon: Link2, run: () => onCreate("integration") }
  ];
  const matches = actions.filter((action) => action.label.toLowerCase().includes(query.toLowerCase()));
  return <div className="command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Command centre search"><div className="command-input"><Search size={19}/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages and actions…"/><kbd>ESC</kbd></div><div className="command-results">{matches.map((action) => { const Icon = action.icon; return <button key={action.label} onClick={action.run}><span><Icon size={17}/></span><strong>{action.label}</strong><small>{action.group}</small><ChevronRight size={16}/></button>; })}{!matches.length && <p className="command-empty">No matching page or action.</p>}</div></section></div>;
}

function CreateModal({ mode, businesses, onClose, onCreated, setNotice }: { mode: Exclude<ModalMode, null>; businesses: DashboardData["businesses"]; onClose: () => void; onCreated: () => Promise<void>; setNotice: (n: { type: "success" | "error"; text: string }) => void }) {
  const [saving, setSaving] = useState(false);
  const titles = { task: "New task", goal: "New goal", social: "Add social account", business: "Add business", transaction: "Record transaction", integration: "Add integration" };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget); const value = (name: string) => String(form.get(name) || "").trim();
    let resource = `${mode}s`; let body: Record<string, unknown> = {};
    if (mode === "task") body = { title: value("title"), details: value("details") || null, priority: value("priority") || "normal", status: "todo", due_date: value("due_date") || null };
    if (mode === "goal") body = { name: value("name"), current_value: Number(value("current_value")) || 0, target_value: Number(value("target_value")), unit: value("unit") || "number", due_date: value("due_date") || null, status: "active" };
    if (mode === "social") body = { platform: value("platform"), handle: value("handle"), profile_url: value("profile_url") || null, followers: Number(value("followers")) || 0, views: Number(value("views")) || 0, source: "manual" };
    if (mode === "business") { resource = "businesses"; body = { name: value("name"), emoji: value("emoji") || "◆", source: value("source") || "manual", currency: value("currency") || "GBP", is_active: true }; }
    if (mode === "transaction") body = { business_id: value("business_id") || null, provider: value("provider") || "manual", description: value("description"), transaction_type: value("transaction_type") || "income", gross_amount: Number(value("gross_amount")) || 0, fee_amount: Number(value("fee_amount")) || 0, net_amount: (Number(value("gross_amount")) || 0) - (Number(value("fee_amount")) || 0), currency: value("currency") || "GBP", occurred_at: value("occurred_at") ? new Date(value("occurred_at")).toISOString() : new Date().toISOString() };
    if (mode === "integration") { const provider = value("provider"); const credentialRef = value("credential_ref"); const accountId = value("channel_id"); const config: Record<string, string> = {}; if (credentialRef) config.credentialRef = credentialRef; if (accountId) config[provider === "instagram" ? "instagramUserId" : "channelId"] = accountId; if (value("handle")) config.handle = value("handle"); if (value("business_id")) config.businessId = value("business_id"); resource = "integrations"; body = { provider, label: value("label"), account_reference: value("account_reference") || null, config, sync_frequency_minutes: Number(value("sync_frequency_minutes")) || 1440, status: "disconnected", is_enabled: false }; }
    try { await api(`/api/resources/${resource}`, { method: "POST", body: JSON.stringify(body) }); await onCreated(); }
    catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Create failed." }); setSaving(false); }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true"><div className="modal-head"><div><p className="eyebrow">Command centre</p><h2>{titles[mode]}</h2></div><button className="icon-button" onClick={onClose}><X/></button></div><form onSubmit={submit}><div className="modal-body"><ModalFields mode={mode} businesses={businesses}/></div><div className="modal-actions"><button type="button" className="ghost-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin"/> : <Plus/>}{saving ? "Saving…" : "Add to system"}</button></div></form></section></div>;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function ModalFields({ mode, businesses }: { mode: Exclude<ModalMode, null>; businesses: DashboardData["businesses"] }) {
  if (mode === "task") return <><Field label="Task"><input name="title" required autoFocus placeholder="What needs to move?"/></Field><Field label="Details"><textarea name="details" placeholder="Context, definition of done or link"/></Field><div className="field-row"><Field label="Priority"><select name="priority"><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></Field><Field label="Due date"><input name="due_date" type="date"/></Field></div></>;
  if (mode === "goal") return <><Field label="Goal"><input name="name" required autoFocus placeholder="First £10k month"/></Field><div className="field-row"><Field label="Current"><input name="current_value" type="number" step="any" defaultValue="0"/></Field><Field label="Target"><input name="target_value" type="number" step="any" required/></Field></div><div className="field-row"><Field label="Unit"><select name="unit"><option value="GBP">GBP</option><option value="followers">followers</option><option value="sales">sales</option><option value="number">number</option><option value="percent">percent</option></select></Field><Field label="Due date"><input name="due_date" type="date"/></Field></div></>;
  if (mode === "social") return <><div className="field-row"><Field label="Platform"><select name="platform"><option value="tiktok">TikTok</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="x">X</option><option value="linkedin">LinkedIn</option><option value="other">Other</option></select></Field><Field label="Handle"><input name="handle" required placeholder="@account"/></Field></div><Field label="Profile URL"><input name="profile_url" type="url" placeholder="https://…"/></Field><div className="field-row"><Field label="Followers"><input name="followers" type="number" defaultValue="0"/></Field><Field label="Views / likes"><input name="views" type="number" defaultValue="0"/></Field></div></>;
  if (mode === "business") return <><Field label="Business name"><input name="name" required autoFocus/></Field><div className="field-row"><Field label="Marker"><input name="emoji" defaultValue="◆" maxLength={4}/></Field><Field label="Currency"><input name="currency" defaultValue="GBP" maxLength={3}/></Field></div><Field label="Primary source"><select name="source"><option value="manual">Manual</option><option value="stripe">Stripe</option><option value="bank">Bank</option><option value="custom">Custom API</option></select></Field></>;
  if (mode === "transaction") return <><Field label="Description"><input name="description" required autoFocus placeholder="Invoice, sale or expense"/></Field><div className="field-row"><Field label="Business"><select name="business_id"><option value="">No business</option>{businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select></Field><Field label="Type"><select name="transaction_type"><option value="income">Income</option><option value="expense">Expense</option><option value="refund">Refund</option><option value="transfer">Transfer</option></select></Field></div><div className="field-row"><Field label="Gross amount"><input name="gross_amount" required type="number" step="0.01"/></Field><Field label="Fee"><input name="fee_amount" type="number" step="0.01" defaultValue="0"/></Field></div><div className="field-row"><Field label="Currency"><input name="currency" defaultValue="GBP" maxLength={3}/></Field><Field label="Date/time"><input name="occurred_at" type="datetime-local"/></Field></div><input type="hidden" name="provider" value="manual"/></>;
  return <><Field label="Provider"><select name="provider"><option value="stripe">Stripe</option><option value="youtube">YouTube</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option><option value="open_banking">Open Banking</option><option value="custom">Custom webhook / API</option></select></Field><Field label="Label"><input name="label" required autoFocus placeholder="TCF Stripe"/></Field><Field label="Account reference"><input name="account_reference" placeholder="Channel ID, account ID or safe label"/></Field><Field label="Credential environment-variable name" hint="Never enter the actual key. Example: TCF_STRIPE_SECRET_KEY"><input name="credential_ref" pattern="TCF_[A-Z0-9_]+" placeholder="TCF_PROVIDER_SECRET"/></Field><div className="field-row"><Field label="Channel / profile ID"><input name="channel_id" placeholder="Optional"/></Field><Field label="Business"><select name="business_id"><option value="">No business mapping</option>{businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select></Field></div><Field label="Sync schedule"><select name="sync_frequency_minutes"><option value="1440">Daily</option><option value="720">Every 12 hours</option><option value="360">Every 6 hours</option><option value="60">Hourly</option></select></Field><div className="security-note"><Settings2 size={17}/><span>Secrets belong in Vercel. This form saves only safe references and identifiers.</span></div></>;
}
