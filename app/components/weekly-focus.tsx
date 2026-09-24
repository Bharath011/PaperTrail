import { Paper, ReadingStatus, statusIcons, statusLabels } from "../papertrail-types";

type Props = {
  papers: Paper[];
  onOpen: (paper: Paper) => void;
  onStatus: (paper: Paper, status: ReadingStatus) => void;
  onRemove: (paper: Paper) => void;
  onChoose: () => void;
  onShare: () => void;
  readOnly?: boolean;
};

export default function WeeklyFocus({ papers, onOpen, onStatus, onRemove, onChoose, onShare, readOnly = false }: Props) {
  return <section className="weekly-focus">
    <div className="focus-heading">
      <div><p className="eyebrow">Weekly reading queue</p><div className="focus-title-line"><h2>Papers in focus this week</h2>{papers.length > 0 && <span className="focus-count">{papers.length} {papers.length === 1 ? "paper" : "papers"}</span>}</div><p>This live list stays in sync for everyone with the shared link.</p></div>
      <div className="focus-heading-actions"><button className="secondary share-focus" onClick={onShare}><span aria-hidden="true">↗</span> Copy site link</button>{!readOnly && <button className="primary" onClick={onChoose}><span aria-hidden="true">+</span> Add papers</button>}</div>
    </div>
    {papers.length ? <div className="focus-grid">{papers.map((paper, index) => <article className="focus-card" key={paper.id}>
      <div className="focus-card-top"><span className="focus-number">{String(index + 1).padStart(2, "0")}</span>{!readOnly && <button className="focus-remove" onClick={()=>onRemove(paper)} aria-label={`Remove ${paper.title} from this week's focus`}>×</button>}</div>
      <h3>{paper.url ? <a href={paper.url} target="_blank" rel="noreferrer">{paper.title}<span>↗</span></a> : <button onClick={()=>onOpen(paper)}>{paper.title}</button>}</h3>
      <p>{paper.section}{paper.year ? ` · ${paper.year}` : ""}</p>
      <label className={`status-select ${paper.status}`}><span>{statusIcons[paper.status]}</span><select aria-label={`Reading status for ${paper.title}`} value={paper.status} disabled={readOnly} onChange={(event)=>onStatus(paper,event.target.value as ReadingStatus)}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    </article>)}</div> : <div className="focus-empty"><div className="focus-empty-mark">✦</div><div><strong>{readOnly ? "Weekly focus is being planned" : "Your weekly focus is clear"}</strong><p>{readOnly ? "The shared reading list is ready for its next papers." : "Choose a few papers from the library below to build this week’s reading queue."}</p></div>{!readOnly && <button className="primary" onClick={onChoose}>Choose papers</button>}</div>}
  </section>;
}
