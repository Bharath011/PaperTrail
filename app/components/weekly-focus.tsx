import { Paper, ReadingStatus, statusIcons, statusLabels } from "../papertrail-types";

type Props = {
  papers: Paper[];
  onOpen: (paper: Paper) => void;
  onStatus: (paper: Paper, status: ReadingStatus) => void;
  onRemove: (paper: Paper) => void;
  onChoose: () => void;
};

export default function WeeklyFocus({ papers, onOpen, onStatus, onRemove, onChoose }: Props) {
  return <section className="weekly-focus">
    <div className="focus-heading">
      <div><p className="eyebrow">Weekly reading queue</p><h2>Papers in focus this week</h2><p>Keep a small, intentional shortlist of what you want to read next.</p></div>
      <button className="secondary" onClick={onChoose}>+ Add from library</button>
    </div>
    {papers.length ? <div className="focus-grid">{papers.map((paper, index) => <article className="focus-card" key={paper.id}>
      <div className="focus-card-top"><span className="focus-number">{String(index + 1).padStart(2, "0")}</span><button className="focus-remove" onClick={()=>onRemove(paper)} aria-label={`Remove ${paper.title} from this week's focus`}>×</button></div>
      <h3>{paper.url ? <a href={paper.url} target="_blank" rel="noreferrer">{paper.title}<span>↗</span></a> : <button onClick={()=>onOpen(paper)}>{paper.title}</button>}</h3>
      <p>{paper.section}{paper.year ? ` · ${paper.year}` : ""}</p>
      <label className={`status-select ${paper.status}`}><span>{statusIcons[paper.status]}</span><select aria-label={`Reading status for ${paper.title}`} value={paper.status} onChange={(event)=>onStatus(paper,event.target.value as ReadingStatus)}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    </article>)}</div> : <div className="focus-empty"><div className="focus-empty-mark">✦</div><div><strong>Your weekly focus is clear</strong><p>Choose a few papers from the library below to build this week&apos;s reading queue.</p></div><button className="primary" onClick={onChoose}>Choose papers</button></div>}
  </section>;
}
