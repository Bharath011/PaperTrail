"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { seedPapers, sourceSections } from "../db/seed-papers";
import { seedResearchers } from "../db/seed-researchers";
import PaperDrawer from "./components/paper-drawer";
import PaperList from "./components/paper-list";
import Sidebar from "./components/sidebar";
import WeeklyFocus from "./components/weekly-focus";
import FocusPicker from "./components/focus-picker";
import ResearcherDirectory from "./components/researcher-directory";
import ResearcherDrawer from "./components/researcher-drawer";
import { Paper, PaperForm, ReadingStatus, statusLabels } from "./papertrail-types";
import { Researcher, ResearcherForm } from "./researcher-types";

const initialPapers: Paper[] = seedPapers.map((paper, index) => ({ ...paper, id: index + 1, venue: "", status: "to-read", keyTakeaways: "", limitations: "", connections: "", tags: "", focusThisWeek: 0 }));
const blankForm = (section = "General"): PaperForm => ({ title:"", authors:"", year:"", section, venue:"", url:"", status:"to-read", remarks:"", keyTakeaways:"", limitations:"", connections:"", tags:"", focusThisWeek:0 });
const initialResearchers: Researcher[] = seedResearchers.map((researcher, index) => ({ ...researcher, id:index + 1, kind:researcher.kind as Researcher["kind"] }));
const blankResearcher: ResearcherForm = { name:"", affiliation:"", profileUrl:"", notes:"", kind:"researcher" };

export default function TrackerClient() {
  const [papers, setPapers] = useState<Paper[]>(initialPapers);
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
  const [researchers, setResearchers] = useState<Researcher[]>(initialResearchers);
  const [researcherDrawer, setResearcherDrawer] = useState(false);
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [researcherForm, setResearcherForm] = useState<ResearcherForm>(blankResearcher);
  const [researcherSaving, setResearcherSaving] = useState(false);
  const [researcherDuplicate, setResearcherDuplicate] = useState("");
  const [dark, setDark] = useState(() => typeof window !== "undefined" && localStorage.getItem("papertrail-theme") === "dark");

  useEffect(() => {
    fetch("/api/papers").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data) => setPapers(data.papers)).catch(() => setToast("Using the imported library while storage reconnects."));
    fetch("/api/researchers").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data) => setResearchers(data.researchers)).catch(() => setToast("Using the imported researcher list while storage reconnects."));
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; localStorage.setItem("papertrail-theme", dark ? "dark" : "light"); }, [dark]);
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
  function editResearcher(researcher: Researcher) { setSelectedResearcher(researcher); setResearcherForm({ name:researcher.name, affiliation:researcher.affiliation, profileUrl:researcher.profileUrl, notes:researcher.notes, kind:researcher.kind }); setResearcherDuplicate(""); setResearcherDrawer(true); }

  async function updateStatus(paper: Paper, status: ReadingStatus) {
    const previous = papers; setPapers((items) => items.map((item) => item.id === paper.id ? {...item,status,isRead:status==='completed'?1:0}:item));
    try { const response = await fetch('/api/papers',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:paper.id,status})}); if(!response.ok) throw new Error(); const data=await response.json(); setPapers((items)=>items.map((item)=>item.id===paper.id?data.paper:item)); setToast(`Moved to ${statusLabels[status]}.`); }
    catch { setPapers(previous); setToast('Could not update reading status.'); }
  }

  async function toggleFocus(paper: Paper) {
    const focusThisWeek = paper.focusThisWeek ? 0 : 1;
    const previous = papers;
    setPapers((items)=>items.map((item)=>item.id===paper.id?{...item,focusThisWeek}:item));
    try { const response=await fetch('/api/papers',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:paper.id,focusThisWeek})}); if(!response.ok) throw new Error(); const data=await response.json(); setPapers((items)=>items.map((item)=>item.id===paper.id?data.paper:item)); setToast(focusThisWeek?'Added to this week.':'Removed from weekly focus.'); }
    catch { setPapers(previous); setToast('Could not update weekly focus.'); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setDuplicate("");
    try {
      const response = await fetch('/api/papers',{method:selected?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(selected?{...form,id:selected.id}:form)});
      const data = await response.json();
      if (response.status === 409) { setDuplicate(`“${data.duplicate.title}” is already in your library.`); return; }
      if (!response.ok) throw new Error(data.error);
      setPapers((items)=>selected?items.map((item)=>item.id===selected.id?data.paper:item):[data.paper,...items]); setDrawer(false); setToast(selected?'Paper updated.':'Paper added to your library.');
    } catch { setToast('The paper could not be saved.'); } finally { setSaving(false); }
  }

  async function deletePaper() {
    if (!selected || !window.confirm(`Delete “${selected.title}”? This cannot be undone.`)) return;
    try { const response=await fetch('/api/papers',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:selected.id})}); if(!response.ok) throw new Error(); setPapers((items)=>items.filter((paper)=>paper.id!==selected.id)); setDrawer(false); setToast('Paper deleted.'); }
    catch { setToast('Could not delete the paper.'); }
  }

  async function submitResearcher(event: FormEvent) {
    event.preventDefault(); setResearcherSaving(true); setResearcherDuplicate("");
    try {
      const response = await fetch("/api/researchers", { method:selectedResearcher ? "PATCH" : "POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(selectedResearcher ? {...researcherForm,id:selectedResearcher.id} : researcherForm) });
      const data = await response.json();
      if (response.status === 409) { setResearcherDuplicate(`“${data.duplicate.name}” is already in your directory.`); return; }
      if (!response.ok) throw new Error(data.error);
      setResearchers((items)=>selectedResearcher ? items.map((item)=>item.id===selectedResearcher.id?data.researcher:item) : [data.researcher,...items]);
      setResearcherDrawer(false); setToast(selectedResearcher ? "Researcher updated." : "Researcher added.");
    } catch { setToast("The researcher could not be saved. Check the profile link and try again."); } finally { setResearcherSaving(false); }
  }

  async function deleteResearcher() {
    if (!selectedResearcher || !window.confirm(`Delete “${selectedResearcher.name}” from People to Follow?`)) return;
    try {
      const response = await fetch("/api/researchers", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id:selectedResearcher.id}) });
      if (!response.ok) throw new Error();
      setResearchers((items)=>items.filter((researcher)=>researcher.id!==selectedResearcher.id)); setResearcherDrawer(false); setToast("Researcher deleted.");
    } catch { setToast("Could not delete the researcher."); }
  }

  return <div className="app-shell">
    <Sidebar papers={papers} sections={sections} researcherCount={researchers.length} view={view} open={sidebarOpen} onView={setView} onClose={()=>setSidebarOpen(false)} />
    <main className="main">
      <header className="topbar"><button className="menu-button" onClick={()=>setSidebarOpen(true)} aria-label="Open navigation">☰</button><label className="search"><span>⌕</span><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={currentSection === "People to Follow" ? "Search researchers, affiliations, or notes…" : "Search title, author, venue, notes, or tags…"} /></label><button className="theme-button" onClick={()=>setDark(!dark)} aria-label={`Switch to ${dark?'light':'dark'} mode`}>{dark?'☀':'☾'}</button><button className="primary add-button" onClick={currentSection === "People to Follow" ? addResearcher : addPaper}><span>+</span> {currentSection === "People to Follow" ? "Add Researcher" : "Add Paper"}</button></header>
      {currentSection === "People to Follow" ? <ResearcherDirectory researchers={researchers} query={query} onAdd={addResearcher} onEdit={editResearcher} /> : <div className="library-view">
        {view === "all" && <WeeklyFocus papers={papers.filter((paper)=>paper.focusThisWeek===1)} onOpen={openPaper} onStatus={updateStatus} onRemove={toggleFocus} onChoose={()=>setFocusPicker(true)} />}
        <div className="page-heading compact"><div><p className="eyebrow">Library</p><h2>{title}</h2><p>{filtered.length} {filtered.length===1?'record':'records'} in this view</p></div></div>
        <div className="toolbar"><div className="filter-group"><label>Year<select value={year} onChange={(e)=>setYear(e.target.value)}><option value="all">All years</option>{years.map((value)=><option key={value}>{value}</option>)}</select></label><label>Sort<select value={sort} onChange={(e)=>setSort(e.target.value)}><option value="recent">Recently added</option><option value="title">Title</option><option value="year">Publication year</option><option value="status">Reading status</option></select></label></div><button className="secondary" onClick={()=>{setQuery('');setYear('all');}}>Clear filters</button></div>
        <PaperList papers={filtered} onOpen={openPaper} onStatus={updateStatus} onAdd={addPaper} />
      </div>}
    </main>
    {drawer && <PaperDrawer paper={selected} form={form} sections={sections} saving={saving} duplicate={duplicate} onChange={setForm} onClose={()=>setDrawer(false)} onSubmit={submit} onDelete={deletePaper} />}
    {researcherDrawer && <ResearcherDrawer researcher={selectedResearcher} form={researcherForm} saving={researcherSaving} duplicate={researcherDuplicate} onChange={setResearcherForm} onClose={()=>setResearcherDrawer(false)} onSubmit={submitResearcher} onDelete={deleteResearcher} />}
    {focusPicker && <FocusPicker papers={papers.filter((paper)=>paper.status!=="completed")} onToggle={toggleFocus} onClose={()=>setFocusPicker(false)} />}
    {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
  </div>;
}
