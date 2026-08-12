import { Paper } from "../papertrail-types";

export default function FocusPicker({ papers, onToggle, onClose }: { papers: Paper[]; onToggle: (paper: Paper) => void; onClose: () => void }) {
  return <div className="picker-shell" role="presentation" onMouseDown={(event)=>event.target===event.currentTarget&&onClose()}><div className="focus-picker" role="dialog" aria-modal="true" aria-labelledby="focus-picker-title">
    <div className="picker-head"><div><p>Weekly queue</p><h2 id="focus-picker-title">Choose papers to focus on</h2></div><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>
    <p className="picker-help">Select papers you want visible at the top of your home page this week.</p>
    <div className="picker-list">{papers.map((paper)=><div className="picker-option" key={paper.id}><input aria-label={`Focus on ${paper.title} this week`} type="checkbox" checked={paper.focusThisWeek===1} onChange={()=>onToggle(paper)} /><button type="button" onClick={()=>onToggle(paper)}><strong>{paper.title}</strong><small>{paper.section}{paper.year?` · ${paper.year}`:""}</small></button></div>)}</div>
    <div className="picker-actions"><button className="primary" onClick={onClose}>Done</button></div>
  </div></div>;
}
