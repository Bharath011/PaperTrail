import { Paper, ReadingStatus, statusIcons, statusLabels } from "../papertrail-types";

export default function PaperList({ papers, onOpen, onStatus, onAdd, readOnly = false }: { papers: Paper[]; onOpen: (paper: Paper) => void; onStatus: (paper: Paper, status: ReadingStatus) => void; onAdd: () => void; readOnly?: boolean }) {
  if (!papers.length) return <div className="empty"><span>◇</span><strong>No papers here yet</strong><p>{readOnly ? "Try another collection or loosen the current filters." : "Add your first paper to this collection or loosen the current filters."}</p>{!readOnly && <button className="primary" onClick={onAdd}>+ Add Paper</button>}</div>;
  return <div className="paper-table" role="table" aria-label="Papers">
    <div className="table-head" role="row"><span>Paper</span><span>Collection</span><span>Year</span><span>Status</span><span /></div>
    {papers.map((paper) => <div className="paper-row" role="button" key={paper.id} onClick={(event) => !(event.target as HTMLElement).closest('select') && onOpen(paper)} tabIndex={0} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onOpen(paper)}>
      <div className="paper-main"><h3>{paper.url ? <a href={paper.url} target="_blank" rel="noreferrer" onClick={(event)=>event.stopPropagation()} aria-label={`Open ${paper.title} in a new tab`}>{paper.title}<span className="title-link-icon">↗</span></a> : <button className="title-button" onClick={(event)=>{event.stopPropagation();onOpen(paper);}}>{paper.title}</button>}</h3><p>{paper.authors || paper.venue || 'Metadata not available'}{paper.venue && paper.authors ? ` · ${paper.venue}` : ''}</p>{paper.tags && <div className="tag-line">{paper.tags.split(',').slice(0,3).map((tag) => <span key={tag}>{tag.trim()}</span>)}</div>}</div>
      <span className="category-cell">{paper.section}</span><span className="year-cell">{paper.year || '—'}</span>
      <div><label className={`status-select ${paper.status}`}><span>{statusIcons[paper.status]}</span><select aria-label={`Reading status for ${paper.title}`} value={paper.status} disabled={readOnly} onChange={(event) => onStatus(paper, event.target.value as ReadingStatus)}>{Object.entries(statusLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
      <span className="row-arrow">›</span>
    </div>)}
  </div>;
}
