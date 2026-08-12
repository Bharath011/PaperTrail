import { Paper, ReadingStatus, statusIcons, statusLabels } from "../papertrail-types";

type Props = { papers: Paper[]; sections: string[]; view: string; open: boolean; onView: (view: string) => void; onClose: () => void };

export default function Sidebar({ papers, sections, view, open, onView, onClose }: Props) {
  const count = (status?: ReadingStatus) => status ? papers.filter((paper) => paper.status === status).length : papers.length;
  const item = (id: string, label: string, total?: number, icon = "•") => <button className={`nav-item ${view === id ? "active" : ""}`} onClick={() => { onView(id); onClose(); }}><span className="nav-icon">{icon}</span><span>{label}</span>{total !== undefined && <span className="nav-count">{total}</span>}</button>;
  return <>
    {open && <button className="mobile-scrim" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand"><div className="brand-mark">P</div><div><h1>PaperTrail</h1><p>Read. Track. Reflect.</p></div></div>
      <nav aria-label="Primary navigation">
        <p className="nav-label">Library</p>{item("all", "All Papers", count(), "▤")}
        <div className="collections">{sections.map((section) => item(`section:${section}`, section, papers.filter((paper) => paper.section === section).length, "–"))}</div>
        <p className="nav-label">Reading</p>{(["to-read", "reading", "completed"] as ReadingStatus[]).map((status) => item(`status:${status}`, statusLabels[status], count(status), statusIcons[status]))}
      </nav>
      <div className="sidebar-foot"><span className="sync-dot" />Imported library · {papers.length} records</div>
    </aside>
  </>;
}
