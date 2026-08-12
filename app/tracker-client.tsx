"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { seedPapers, sourceSections } from "../db/seed-papers";

type Paper = { id: number; title: string; authors: string; year: string; section: string; url: string; remarks: string; isRead: number };

const fallbackPapers: Paper[] = seedPapers.map((paper, index) => ({ ...paper, id: index + 1 }));

const blankForm = { title: "", authors: "", year: new Date().getFullYear().toString(), section: "", url: "", remarks: "" };

export default function TrackerClient() {
  const [papers, setPapers] = useState<Paper[]>(fallbackPapers);
  const [section, setSection] = useState("All papers");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Paper | null>(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/papers").then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => data.papers?.length && setPapers(data.papers))
      .catch(() => setStatus("Showing the starter library while storage connects."));
  }, []);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(""), 3200);
    return () => clearTimeout(timer);
  }, [status]);

  const sections = useMemo(() => ["All papers", ...Array.from(new Set([...sourceSections, ...papers.map((paper) => paper.section)]))], [papers]);
  const visible = useMemo(() => papers.filter((paper) => {
    const inSection = section === "All papers" || paper.section === section;
    const inFilter = filter === "all" || (filter === "read" ? paper.isRead === 1 : paper.isRead === 0);
    return inSection && inFilter && `${paper.title} ${paper.authors} ${paper.remarks}`.toLowerCase().includes(query.toLowerCase());
  }), [papers, section, filter, query]);
  const readCount = papers.filter((paper) => paper.isRead === 1).length;
  const progress = papers.length ? Math.round((readCount / papers.length) * 100) : 0;

  async function updatePaper(patch: Partial<Paper> & { id: number }) {
    const before = papers;
    setPapers((current) => current.map((paper) => paper.id === patch.id ? { ...paper, ...patch } : paper));
    try {
      const response = await fetch("/api/papers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setPapers((current) => current.map((paper) => paper.id === patch.id ? data.paper : paper));
    } catch { setPapers(before); setStatus("That change could not be saved yet."); }
  }

  function openAdd() {
    setEditing(null);
    setForm({ ...blankForm, section: section === "All papers" ? (sections[1] ?? "General") : section });
    setModalOpen(true);
  }

  function openEdit(paper: Paper) {
    setEditing(paper);
    setForm({ title: paper.title, authors: paper.authors, year: paper.year, section: paper.section, url: paper.url, remarks: paper.remarks });
    setModalOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      const response = await fetch("/api/papers", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing ? { ...form, id: editing.id } : form) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (editing) setPapers((current) => current.map((paper) => paper.id === editing.id ? data.paper : paper));
      else setPapers((current) => [data.paper, ...current]);
      setModalOpen(false); setStatus(editing ? "Paper updated." : "Paper added to your library.");
    } catch { setStatus("The paper could not be saved yet."); }
    finally { setSaving(false); }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">M</div><div><h1>Marginalia</h1><p>Research reading desk</p></div></div>
      <p className="nav-label">Collections</p>
      <nav className="section-list" aria-label="Paper collections">{sections.map((name) => <button key={name} className={`section-button ${section === name ? "active" : ""}`} onClick={() => setSection(name)}><span>{name}</span><span className="count">{name === "All papers" ? papers.length : papers.filter((paper) => paper.section === name).length}</span></button>)}</nav>
      <div className="sidebar-note"><strong>Your quiet research archive</strong>Each spreadsheet tab becomes a collection. Reading status and remarks stay attached to every paper.</div>
    </aside>

    <main className="main">
      <header className="topbar">
        <label className="search"><span className="sr-only">Search papers</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, author, or remark…" /></label>
        <button className="add-button" onClick={openAdd} aria-label="Add a paper"><span className="plus">+</span><span className="add-label">Add paper</span></button>
      </header>
      <section className="hero-row"><div className="hero"><p className="eyebrow">Literature survey</p><h2>{section}</h2><p className="hero-subtitle">Keep the argument close and the citations closer. Mark what you’ve read, capture the useful thought, and return when it’s time to write.</p></div><div className="progress-ring" aria-label={`${progress}% read`}><div className="progress-number">{progress}%</div><div className="progress-label">read · {readCount}/{papers.length}</div><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div></div></section>
      <div className="filters" aria-label="Reading status filter">{(["all", "unread", "read"] as const).map((name) => <button key={name} onClick={() => setFilter(name)} className={`filter ${filter === name ? "active" : ""}`}>{name === "all" ? "All" : name === "unread" ? "To read" : "Read"}</button>)}</div>
      <section className="paper-list" aria-live="polite">{visible.length ? visible.map((paper) => <article className="paper-card" key={paper.id}>
        <input className="check" type="checkbox" checked={paper.isRead === 1} onChange={() => updatePaper({ id: paper.id, isRead: paper.isRead ? 0 : 1 })} aria-label={`Mark ${paper.title} as ${paper.isRead ? "unread" : "read"}`} />
        <div><h3 className={`paper-title ${paper.isRead ? "done" : ""}`}>{paper.title}</h3><div className="paper-meta"><span>{paper.authors || "Unknown authors"}</span><span>{paper.year || "Year not set"}</span><span>{paper.section}</span></div>{paper.remarks && <p className="remark">{paper.remarks}</p>}</div>
        <div className="card-actions"><button className="icon-btn" onClick={() => openEdit(paper)} aria-label={`Edit remarks for ${paper.title}`}>✎</button>{paper.url && <a className="icon-btn external" href={paper.url} target="_blank" rel="noreferrer" aria-label={`Open ${paper.title}`}>↗</a>}</div>
      </article>) : <div className="empty"><strong>No papers on this page</strong>Try another filter, or add the first paper to this collection.</div>}</section>
    </main>

    {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setModalOpen(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="paper-form-title">
      <div className="modal-head"><h3 id="paper-form-title">{editing ? "Edit paper" : "Add a paper"}</h3><button className="close" onClick={() => setModalOpen(false)} aria-label="Close">×</button></div>
      <form onSubmit={submit}><div className="form-grid">
        <div className="field full"><label htmlFor="title">Paper title</label><input id="title" required autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Attention Is All You Need" /></div>
        <div className="field"><label htmlFor="authors">Authors</label><input id="authors" value={form.authors} onChange={(event) => setForm({ ...form, authors: event.target.value })} placeholder="Vaswani et al." /></div>
        <div className="field"><label htmlFor="year">Year</label><input id="year" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} placeholder="2024" /></div>
        <div className="field"><label htmlFor="section">Collection</label><input id="section" list="section-options" required value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value })} placeholder="New or existing section" /><datalist id="section-options">{sections.slice(1).map((name) => <option key={name} value={name} />)}</datalist></div>
        <div className="field"><label htmlFor="url">Paper link</label><input id="url" type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://…" /></div>
        <div className="field full"><label htmlFor="remarks">Reading remarks</label><textarea id="remarks" value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} placeholder="Main finding, limitation, quote, or idea to revisit…" /></div>
      </div><div className="form-actions"><button type="button" className="secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="save" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add to library"}</button></div></form>
    </div></div>}
    {status && <div className="status" role="status">{status}</div>}
  </div>;
}
