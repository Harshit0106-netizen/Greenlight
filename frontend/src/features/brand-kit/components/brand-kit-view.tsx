"use client";
import { useMemo, useState } from "react";
import { BookOpen, FileText, Image as ImageIcon, Plus, Search, ShieldCheck, Tags } from "lucide-react";
import { Badge, Button, Card, EmptyState, PageHeader, StatCard, StatusBadge, Tabs, type TabItem } from "@/components/ui";
import { workspace } from "@/config/site";
import { can, useSession } from "@/lib/session";
import { useBrandKit, useBrandKitMeta } from "../store";
import { AddSourceModal, type SourceKind } from "./add-source-modal";
import { FactCard, RuleCard, TermRow, VisualAssets } from "./kit-items";

type TabId = "rules" | "facts" | "terms" | "visual";
const addKind: Record<TabId, SourceKind> = { rules: "rule", facts: "fact", terms: "term", visual: "rule" };

export function BrandKitView() {
  const kit = useBrandKit();
  const { version, loaded, error } = useBrandKitMeta();
  const mayEdit = can.editBrandKit(useSession()?.role);
  const KIT_VERSION = version || "—";
  const [tab, setTab] = useState<TabId>("rules");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const q = query.toLowerCase();
  const match = (...parts: string[]) => parts.join(" ").toLowerCase().includes(q);

  const rules = useMemo(() => kit.rules.filter(r => match(r.title, r.description, r.category)), [kit.rules, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const facts = useMemo(() => kit.facts.filter(f => match(f.subject, f.approvedText)), [kit.facts, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const terms = useMemo(() => kit.terms.filter(t => match(t.avoid, t.use, t.note)), [kit.terms, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: TabItem<TabId>[] = [
    { id: "rules", label: "Guidelines", icon: BookOpen, count: kit.rules.length },
    { id: "facts", label: "Approved facts", icon: FileText, count: kit.facts.length },
    { id: "terms", label: "Terminology", icon: Tags, count: kit.terms.length },
    { id: "visual", label: "Visual assets", icon: ImageIcon }
  ];
  const open = () => setModal(true);

  return (
    <div>
      <PageHeader eyebrow="Brand governance · Source of truth" title="Brand Kit" description="The approved knowledge Greenlight uses to evaluate content. Changes apply to the very next review."
        actions={mayEdit ? <Button size="lg" onClick={open}><Plus size={16} /> Add source</Button> : undefined} />

      {error && <p role="alert" className="mb-5 rounded-xl border border-danger/25 bg-danger/10 p-3 text-xs text-danger">{error}</p>}
      {!mayEdit && loaded && <p className="mb-5 rounded-xl border border-line bg-soft p-3 text-xs text-muted">Only brand admins can add sources. Adding a source creates a new Brand Kit version; sources cannot be deleted yet.</p>}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Active guidelines" value={kit.rules.length} />
        <StatCard icon={FileText} tone="success" label="Approved facts" value={kit.facts.length} />
        <StatCard icon={Tags} tone="warning" label="Terminology rules" value={kit.terms.length} />
        <StatCard icon={ShieldCheck} tone="info" label="Published version" value={KIT_VERSION} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-line bg-gradient-to-r from-brand/10 via-surface to-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-brand-ink shadow-glow"><ShieldCheck size={22} /></span>
            <div><div className="text-sm font-bold text-ink">{workspace.name}</div><div className="mt-0.5 text-xs text-muted">Master Brand Kit · Version {KIT_VERSION}</div></div>
          </div>
          <StatusBadge>Published</StatusBadge>
        </div>
        <Tabs items={tabs} value={tab} onChange={t => { setTab(t); setQuery(""); }} />

        {tab !== "visual" && (
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-sm font-bold text-ink">{tabs.find(t => t.id === tab)?.label}</h2><p className="mt-0.5 text-xs text-muted">Manage approved sources used by the review engine.</p></div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…" aria-label="Search Brand Kit"
                  className="h-9 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-brand/15" />
              </div>
              {mayEdit && <Button size="sm" onClick={open}><Plus size={13} /> Add</Button>}
            </div>
          </div>
        )}

        {tab === "rules" && <div className="grid gap-3 px-5 pb-5">{rules.map(r => <RuleCard key={r.id} rule={r} />)}{!rules.length && <EmptyState icon={BookOpen} title="No guidelines match your search" />}</div>}
        {tab === "facts" && <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">{facts.map(f => <FactCard key={f.id} fact={f} />)}{!facts.length && <div className="md:col-span-2"><EmptyState icon={FileText} title="No approved facts match your search" /></div>}</div>}
        {tab === "terms" && (
          <div className="px-5 pb-5">
            <div className="mb-3 grid grid-cols-[1fr_28px_1fr] gap-3 px-3 text-[11px] font-bold uppercase tracking-wider text-muted"><span>Avoid using</span><span /><span>Preferred term</span></div>
            <div className="space-y-2">{terms.map(t => <TermRow key={t.id} term={t} />)}{!terms.length && <EmptyState icon={Tags} title="No terminology rules match your search" />}</div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted"><Badge tone="brand">Live</Badge> Terms here are matched by the review engine on every new submission.</p>
          </div>
        )}
        {tab === "visual" && <VisualAssets />}
      </Card>

      <AddSourceModal open={modal} initialKind={addKind[tab]} onClose={() => setModal(false)} />
    </div>
  );
}
