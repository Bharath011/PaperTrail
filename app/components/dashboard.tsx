import { Paper } from "../papertrail-types";

export default function Dashboard({ papers, onOpen, onNavigate }: { papers: Paper[]; onOpen: (paper: Paper) => void; onNavigate: (view: string) => void }) {
  const completed = papers.filter((paper) => paper.status === "completed").length;
  const reading = papers.filter((paper) => paper.status === "reading").length;
  const toRead = papers.length - completed - reading;
  const progress = papers.length ? Math.round(completed / papers.length * 100) : 0;
  const sections = Array.from(new Set(papers.map((paper) => paper.section))).map((name) => ({ name, total: papers.filter((paper) => paper.section === name).length, completed: papers.filter((paper) => paper.section === name && paper.status === "completed").length })).sort((a,b) => b.total-a.total);
  const next = papers.filter((paper) => paper.status !== "completed").slice(0, 4);
  return <div className="dashboard">
    <div className="page-heading"><div><p className="eyebrow">Overview</p><h2>Your research at a glance</h2><p>See what you have collected, where your attention is going, and what to read next.</p></div><div className="completion"><strong>{progress}%</strong><span>complete</span></div></div>
    <section className="stat-grid" aria-label="Library statistics">
      {[['Total Papers', papers.length, '▤', 'all'], ['To Read', toRead, '○', 'status:to-read'], ['Reading', reading, '◐', 'status:reading'], ['Completed', completed, '✓', 'status:completed']].map(([label,value,icon,view]) => <button className="stat-card" key={label} onClick={() => onNavigate(String(view))}><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong></button>)}
    </section>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-head"><div><h3>Progress by collection</h3><p>Completion across your main research areas</p></div></div><div className="progress-list">{sections.map((item) => { const percent = item.total ? Math.round(item.completed/item.total*100) : 0; return <button key={item.name} onClick={() => onNavigate(`section:${item.name}`)} className="progress-row"><span><b>{item.name}</b><small>{item.completed} of {item.total}</small></span><div className="bar"><i style={{width:`${percent}%`}} /></div><em>{percent}%</em></button>; })}</div></section>
      <section className="panel"><div className="panel-head"><div><h3>Up next</h3><p>A short queue from your unread library</p></div><button onClick={() => onNavigate('status:to-read')}>View all</button></div><div className="next-list">{next.map((paper) => <button key={paper.id} onClick={() => onOpen(paper)}><span className={`mini-status ${paper.status}`} /> <span><b>{paper.title}</b><small>{paper.section}{paper.year ? ` · ${paper.year}` : ''}</small></span><i>›</i></button>)}</div></section>
    </div>
  </div>;
}
