"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { sourceSections } from "../db/seed-papers";
import PaperDrawer from "./components/paper-drawer";
import PaperList from "./components/paper-list";
import Sidebar from "./components/sidebar";
import WeeklyFocus from "./components/weekly-focus";
import FocusPicker from "./components/focus-picker";
import ResearcherDirectory from "./components/researcher-directory";
import ResearcherDrawer from "./components/researcher-drawer";
import { Paper, PaperForm, ReadingStatus, statusLabels } from "./papertrail-types";
import { Researcher, ResearcherForm } from "./researcher-types";

const blankForm = (section = "General"): PaperForm => ({ title:"", authors:"", year:"", section, venue:"", url:"", status:"to-read", remarks:"", keyTakeaways:"", limitations:"", connections:"", tags:"", focusThisWeek:0 });
const blankResearcher: ResearcherForm = { name:"", affiliation:"", profileUrl:"", notes:"", kind:"researcher" };
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const normalizeUrl = (value: string) => value.toLowerCase().replace(/^https?:\/\/(www\.)?/,"").replace(/\/$/,"");
function legacyCollection<T>(key: string): T[] | null {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return null;
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : null;
  } catch { return null; }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBase = (import.meta.env.VITE_PAPERTRAIL_API_URL || "").replace(/\/$/, "");
  const editorKey = typeof window !== "undefined" ? sessionStorage.getItem("papertrail-editor-key") : null;
  const response = await fetch(`${apiBase}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(editorKey ? { "X-PaperTrail-Editor":editorKey } : {}), ...init?.headers }, cache: "no-store" });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

function subscribeEditor(onChange: () => void) {
  window.addEventListener("papertrail-editor-change", onChange);
  return () => window.removeEventListener("papertrail-editor-change", onChange);
}

function getEditorStatus() {
  return Boolean(sessionStorage.getItem("papertrail-editor-key"));
}

export default function TrackerClient() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState("");
  const [view, setView] = useState("all");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState("recent");
  const [drawer, setDrawer] = useState(false);
  const [selected, setSelected] = useState<Paper | null>(null);
  const [form, setForm] = useState<PaperForm>(blankForm());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [duplicate, setDuplicate] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusPicker, setFocusPicker] = useState(false);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [researcherDrawer, setResearcherDrawer] = useState(false);
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [researcherForm, setResearcherForm] = useState<ResearcherForm>(blankResearcher);
  const [researcherSaving, setResearcherSaving] = useState(false);
  const [researcherDuplicate, setResearcherDuplicate] = useState("");
  const isEditor = useSyncExternalStore(subscribeEditor, getEditorStatus, () => false);
  const [editorDialog, setEditorDialog] = useState(false);
  const [editorKey, setEditorKey] = useState("");
  const [editorSaving, setEditorSaving] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "sage";
    const saved = localStorage.getItem("papertrail-theme");
    return saved === "dark" || saved === "midnight" ? saved : "sage";
  });

  const refreshSharedData = useCallback(async (silent = false) => {
    try {
      if (isEditor && localStorage.getItem("papertrail-shared-library-v1") !== "done") {
        await apiRequest("/api/bootstrap", { method:"POST", body:JSON.stringify({ papers:legacyCollection<Paper>("papertrail-papers"), researchers:legacyCollection<Researcher>("papertrail-researchers") }) });
        localStorage.setItem("papertrail-shared-library-v1", "done");
      }
      const [paperData, researcherData] = await Promise.all([
        apiRequest<{ papers: Paper[] }>("/api/papers"),
        apiRequest<{ researchers: Researcher[] }>("/api/researchers"),
      ]);
      setPapers(paperData.papers);
      setResearchers(researcherData.researchers);
      setSyncError("");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "The shared library could not be reached.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isEditor]);

  useEffect(() => {
    // Fetch shared state from the server and keep other viewers in sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshSharedData();
    const interval = window.setInterval(() => void refreshSharedData(true), 10000);
    return () => window.clearInterval(interval);
  }, [refreshSharedData]);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("papertrail-theme", theme); }, [theme]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 3500); return () => clearTimeout(timer); }, [toast]);

  const sections = useMemo(() => Array.from(new Set([...sourceSections, ...papers.map((paper) => paper.section)])), [papers]);
  const years = useMemo(() => Array.from(new Set(papers.map((paper) => paper.year).filter(Boolean))).sort().reverse(), [papers]);
  const currentSection = view.startsWith("section:") ? view.slice(8) : null;
  const currentStatus = view.startsWith("status:") ? view.slice(7) as ReadingStatus : null;
  const title = currentSection ?? (currentStatus ? statusLabels[currentStatus] : "All Papers");
  const filtered = useMemo(() => {
    const result = papers.filter((paper) => {
      const matchesView = currentSection ? paper.section === currentSection : currentStatus ? paper.status === currentStatus : true;
      const text = `${paper.title} ${paper.authors} ${paper.venue} ${paper.section} ${paper.remarks} ${paper.keyTakeaways} ${paper.tags}`.toLowerCase();
      return matchesView && (year === "all" || paper.year === year) && text.includes(query.toLowerCase());
    });
    return result.sort((a,b) => sort === "title" ? a.title.localeCompare(b.title) : sort === "year" ? (b.year||"").localeCompare(a.year||"") : sort === "status" ? a.status.localeCompare(b.status) : (b.id-a.id));
  }, [papers,currentSection,currentStatus,year,query,sort]);

  function openPaper(paper: Paper) { setSelected(paper); setForm({ title:paper.title, authors:paper.authors, year:paper.year, section:paper.section, venue:paper.venue, url:paper.url, status:paper.status, remarks:paper.remarks, keyTakeaways:paper.keyTakeaways, limitations:paper.limitations, connections:paper.connections, tags:paper.tags, focusThisWeek:paper.focusThisWeek }); setDuplicate(""); setDrawer(true); }
  function addPaper() { const section = currentSection ?? sections[0] ?? "General"; setSelected(null); setForm(blankForm(section)); setDuplicate(""); setDrawer(true); }
  function addResearcher() { setSelectedResearcher(null); setResearcherForm(blankResearcher); setResearcherDuplicate(""); setResearcherDrawer(true); }
  function addResource() { setSelectedResearcher(null); setResearcherForm({...blankResearcher,kind:"resource"}); setResearcherDuplicate(""); setResearcherDrawer(true); }
  function editResearcher(researcher: Researcher) { setSelectedResearcher(researcher); setResearcherForm({ name:researcher.name, affiliation:researcher.affiliation, profileUrl:researcher.profileUrl, notes:researcher.notes, kind:researcher.kind }); setResearcherDuplicate(""); setResearcherDrawer(true); }

  function toggleEditor() {
    if (isEditor) {
      sessionStorage.removeItem("papertrail-editor-key");
      window.dispatchEvent(new Event("papertrail-editor-change"));
      setToast("Editing is off for this tab.");
      return;
    }
    setEditorDialog(true);
  }

  async function enableEditor(event: FormEvent) {
    event.preventDefault();
    if (!editorKey.trim()) return;
    setEditorSaving(true);
    try {
      const apiBase = (import.meta.env.VITE_PAPERTRAIL_API_URL || "").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/editor/verify`, { method:"POST", headers:{ "X-PaperTrail-Editor":editorKey } });
      if (!response.ok) throw new Error(await response.text() || "Editor access was not accepted.");
      sessionStorage.setItem("papertrail-editor-key", editorKey);
      window.dispatchEvent(new Event("papertrail-editor-change"));
      setEditorDialog(false);
      setEditorKey("");
      setToast("Edit mode is on for this tab.");
    } catch (error) { setToast(error instanceof Error ? error.message : "Couldn’t enable edit mode."); }
    finally { setEditorSaving(false); }
  }

  async function updateStatus(paper: Paper, status: ReadingStatus) {
    try {
      const result = await apiRequest<{ paper: Paper }>("/api/papers", { method:"PATCH", body:JSON.stringify({ id:paper.id, status }) });
      setPapers((items) => items.map((item) => item.id === paper.id ? result.paper : item));
      setToast(`Moved to ${statusLabels[status]}.`);
    } catch (error) { setToast(error instanceof Error ? `Couldn’t save status: ${error.message}` : "Couldn’t save the status."); }
  }

  async function toggleFocus(paper: Paper) {
    const focusThisWeek = paper.focusThisWeek ? 0 : 1;
    try {
      const result = await apiRequest<{ paper: Paper }>("/api/papers", { method:"PATCH", body:JSON.stringify({ id:paper.id, focusThisWeek }) });
      setPapers((items)=>items.map((item)=>item.id===paper.id?result.paper:item));
      setToast(focusThisWeek?'Added to this week.':'Removed from weekly focus.');
    } catch (error) { setToast(error instanceof Error ? `Couldn’t update weekly focus: ${error.message}` : "Couldn’t update weekly focus."); }
  }

  async function shareFocus() {
    const url = new URL(window.location.pathname, window.location.origin);
    try {
      await navigator.clipboard.writeText(url.toString());
      setToast("Shared PaperTrail link copied. Your reading list stays up to date for everyone.");
    } catch { setToast("Couldn’t copy the link. Check your browser’s clipboard permissions."); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setDuplicate("");
    const match = papers.find((paper)=>paper.id!==selected?.id && (normalize(paper.title)===normalize(form.title) || (form.url && paper.url && normalizeUrl(paper.url)===normalizeUrl(form.url))));
    if (match) { setDuplicate(`“${match.title}” is already in your library.`); setSaving(false); return; }
    try {
      const result = await apiRequest<{ paper: Paper }>("/api/papers", { method:selected ? "PATCH" : "POST", body:JSON.stringify(selected ? { ...form, id:selected.id } : form) });
      setPapers((items)=>selected?items.map((item)=>item.id===selected.id?result.paper:item):[result.paper,...items]);
      setDrawer(false); setToast(selected?'Paper updated for everyone.':'Paper added to the shared library.');
    } catch (error) { setDuplicate(error instanceof Error ? error.message : "Couldn’t save this paper."); }
    finally { setSaving(false); }
  }

  async function deletePaper() {
    if (!selected || !window.confirm(`Delete “${selected.title}”? This cannot be undone.`)) return;
    try {
      await apiRequest<{ paper: Paper }>("/api/papers", { method:"DELETE", body:JSON.stringify({ id:selected.id }) });
      setPapers((items)=>items.filter((paper)=>paper.id!==selected.id)); setDrawer(false); setToast('Paper deleted from the shared library.');
    } catch (error) { setToast(error instanceof Error ? `Couldn’t delete this paper: ${error.message}` : "Couldn’t delete this paper."); }
  }

  async function submitResearcher(event: FormEvent) {
    event.preventDefault(); setResearcherSaving(true); setResearcherDuplicate("");
    const match = researchers.find((researcher)=>researcher.id!==selectedResearcher?.id && (normalize(researcher.name)===normalize(researcherForm.name) || (researcherForm.profileUrl && researcher.profileUrl && normalizeUrl(researcher.profileUrl)===normalizeUrl(researcherForm.profileUrl))));
    if (match) { setResearcherDuplicate(`“${match.name}” is already in your directory.`); setResearcherSaving(false); return; }
    try {
      const result = await apiRequest<{ researcher: Researcher }>("/api/researchers", { method:selectedResearcher ? "PATCH" : "POST", body:JSON.stringify(selectedResearcher ? { ...researcherForm, id:selectedResearcher.id } : researcherForm) });
      setResearchers((items)=>selectedResearcher ? items.map((item)=>item.id===selectedResearcher.id?result.researcher:item) : [result.researcher,...items]);
      setResearcherDrawer(false); setToast(selectedResearcher ? "Researcher updated for everyone." : "Researcher added to the shared directory.");
    } catch (error) { setResearcherDuplicate(error instanceof Error ? error.message : "Couldn’t save this researcher."); }
    finally { setResearcherSaving(false); }
  }

  async function deleteResearcher() {
    if (!selectedResearcher || !window.confirm(`Delete “${selectedResearcher.name}” from People to Follow?`)) return;
    try {
      await apiRequest<{ researcher: Researcher }>("/api/researchers", { method:"DELETE", body:JSON.stringify({ id:selectedResearcher.id }) });
      setResearchers((items)=>items.filter((researcher)=>researcher.id!==selectedResearcher.id)); setResearcherDrawer(false); setToast("Researcher deleted from the shared directory.");
    } catch (error) { setToast(error instanceof Error ? `Couldn’t delete this researcher: ${error.message}` : "Couldn’t delete this researcher."); }
  }

  return <div className="app-shell">
    <Sidebar papers={papers} sections={sections} researcherCount={researchers.length} view={view} open={sidebarOpen} onView={setView} onClose={()=>setSidebarOpen(false)} />
    <main className="main">
      <header className="topbar">
        <button className="menu-button" onClick={()=>setSidebarOpen(true)} aria-label="Open navigation">☰</button>
        <label className="search"><span>⌕</span><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={currentSection === "People to Follow" ? "Search researchers, affiliations, or notes…" : "Search title, author, venue, notes, or tags…"} /></label>
        <span className={`sync-status ${syncError ? "offline" : loading ? "loading" : "online"}`} title={syncError || "Changes sync for everyone"}><i />{syncError ? "Offline" : loading ? "Connecting" : "Live"}</span>
        <label className="theme-picker"><span>Theme</span><select aria-label="Choose appearance" value={theme} onChange={(event)=>setTheme(event.target.value)}><option value="sage">Sage</option><option value="dark">Sage night</option><option value="midnight">Ink</option></select></label>
        <button className="secondary editor-button" onClick={toggleEditor}>{isEditor ? "Exit editing" : "Editor access"}</button>
        {isEditor && <button className="primary add-button" disabled={loading || Boolean(syncError)} onClick={currentSection === "People to Follow" ? addResearcher : addPaper}><span>+</span> {currentSection === "People to Follow" ? "Add Researcher" : "Add Paper"}</button>}
      </header>
      {syncError && <div className="sync-banner" role="alert"><strong>Shared library is unavailable.</strong> {syncError} Reconnect to the database to load and save changes.</div>}
      {loading && <div className="loading-banner" role="status"><span className="loading-spinner" />Connecting to the shared library…</div>}
      {currentSection === "People to Follow" ? <ResearcherDirectory researchers={researchers} query={query} onAdd={addResearcher} onAddResource={addResource} onEdit={editResearcher} readOnly={!isEditor} /> : <div className="library-view">
        {view === "all" && <WeeklyFocus papers={papers.filter((paper)=>paper.focusThisWeek===1)} onOpen={openPaper} onStatus={updateStatus} onRemove={toggleFocus} onChoose={()=>isEditor && setFocusPicker(true)} onShare={shareFocus} readOnly={!isEditor} />}
        <div className="page-heading compact"><div><p className="eyebrow">Library</p><h2>{title}</h2><p>{filtered.length} {filtered.length===1?'record':'records'} in this view</p></div></div>
        <div className="toolbar"><div className="filter-group"><label>Year<select value={year} onChange={(e)=>setYear(e.target.value)}><option value="all">All years</option>{years.map((value)=><option key={value}>{value}</option>)}</select></label><label>Sort<select value={sort} onChange={(e)=>setSort(e.target.value)}><option value="recent">Recently added</option><option value="title">Title</option><option value="year">Publication year</option><option value="status">Reading status</option></select></label></div><button className="secondary" onClick={()=>{setQuery('');setYear('all');}}>Clear filters</button></div>
        <PaperList papers={filtered} onOpen={openPaper} onStatus={updateStatus} onAdd={addPaper} readOnly={!isEditor} />
      </div>}
    </main>
    {drawer && <PaperDrawer paper={selected} form={form} sections={sections} saving={saving} duplicate={duplicate} onChange={setForm} onClose={()=>setDrawer(false)} onSubmit={submit} onDelete={deletePaper} readOnly={!isEditor} />}
    {researcherDrawer && <ResearcherDrawer researcher={selectedResearcher} form={researcherForm} saving={researcherSaving} duplicate={researcherDuplicate} onChange={setResearcherForm} onClose={()=>setResearcherDrawer(false)} onSubmit={submitResearcher} onDelete={deleteResearcher} readOnly={!isEditor} />}
    {focusPicker && isEditor && <FocusPicker papers={papers.filter((paper)=>paper.status!=="completed")} onToggle={toggleFocus} onClose={()=>setFocusPicker(false)} />}
    {editorDialog && <div className="picker-shell" role="presentation"><form className="editor-dialog" role="dialog" aria-modal="true" aria-labelledby="editor-dialog-title" onSubmit={enableEditor}><div className="picker-head"><div><p>Owner access</p><h2 id="editor-dialog-title">Edit the shared library</h2></div><button type="button" className="icon-button" onClick={()=>setEditorDialog(false)} aria-label="Close">×</button></div><p className="editor-dialog-copy">Viewing is public. Enter your editor key to change the shared reading list.</p><label className="editor-key-label">Editor key<input type="password" autoComplete="current-password" value={editorKey} onChange={(event)=>setEditorKey(event.target.value)} /></label><div className="picker-actions"><button type="button" className="secondary" onClick={()=>setEditorDialog(false)}>Cancel</button><button type="submit" className="primary" disabled={editorSaving || !editorKey.trim()}>{editorSaving ? "Checking…" : "Continue"}</button></div></form></div>}
    {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
  </div>;
}
