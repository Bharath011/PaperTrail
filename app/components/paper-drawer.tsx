import { FormEvent } from "react";
import { Paper, PaperForm, ReadingStatus, statusLabels } from "../papertrail-types";

type Props = { paper: Paper | null; form: PaperForm; sections: string[]; saving: boolean; duplicate: string; onChange: (form: PaperForm) => void; onClose: () => void; onSubmit: (event: FormEvent) => void; onDelete: () => void; readOnly?: boolean };

export default function PaperDrawer({ paper, form, sections, saving, duplicate, onChange, onClose, onSubmit, onDelete, readOnly = false }: Props) {
  return <div className="drawer-shell" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
    <div className="drawer-head"><div><p>{readOnly ? 'Shared paper details' : paper ? 'Paper details' : 'New paper'}</p><h2 id="drawer-title">{paper ? paper.title : 'Add to your library'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>
    <form onSubmit={onSubmit}>
      <fieldset className="drawer-fields" disabled={readOnly}>
      <div className="drawer-section"><h3>Paper information</h3><div className="form-grid">
        <label className="full">Title<input required value={form.title} onChange={(e)=>onChange({...form,title:e.target.value})} /></label>
        <label>Authors<input value={form.authors} onChange={(e)=>onChange({...form,authors:e.target.value})} placeholder="Author names" /></label>
        <label>Year<input value={form.year} onChange={(e)=>onChange({...form,year:e.target.value})} placeholder="2026" /></label>
        <label>Publication / venue<input value={form.venue} onChange={(e)=>onChange({...form,venue:e.target.value})} placeholder="ICLR, arXiv…" /></label>
        <label>Category<input required list="papertrail-sections" value={form.section} onChange={(e)=>onChange({...form,section:e.target.value})} /><datalist id="papertrail-sections">{sections.map((s)=><option value={s} key={s}/>)}</datalist></label>
        <label className="full">Paper link<input type="url" value={form.url} onChange={(e)=>onChange({...form,url:e.target.value})} placeholder="https://…" /></label>
      </div></div>
      <div className="drawer-section"><h3>Reading workflow</h3><div className="status-options">{Object.entries(statusLabels).map(([value,label])=><button type="button" className={form.status===value?'selected':''} key={value} onClick={()=>onChange({...form,status:value as ReadingStatus})}><i className={value}/>{label}</button>)}</div></div>
      <div className="drawer-section focus-toggle"><div><input aria-label="Focus this paper this week" type="checkbox" checked={form.focusThisWeek===1} onChange={(event)=>onChange({...form,focusThisWeek:event.target.checked?1:0})} /><button type="button" onClick={()=>onChange({...form,focusThisWeek:form.focusThisWeek?0:1})}><strong>Focus this week</strong><small>Pin this paper to your weekly reading queue.</small></button></div></div>
      <div className="drawer-section notes"><h3>Research notes</h3><label>My remarks<textarea value={form.remarks} onChange={(e)=>onChange({...form,remarks:e.target.value})} placeholder="What matters about this paper?" /></label><label>Key takeaways<textarea value={form.keyTakeaways} onChange={(e)=>onChange({...form,keyTakeaways:e.target.value})} placeholder="Main findings and useful claims…" /></label><div className="form-grid"><label>Limitations<textarea value={form.limitations} onChange={(e)=>onChange({...form,limitations:e.target.value})} /></label><label>Ideas / connections<textarea value={form.connections} onChange={(e)=>onChange({...form,connections:e.target.value})} /></label></div><label>Tags<input value={form.tags} onChange={(e)=>onChange({...form,tags:e.target.value})} placeholder="LLM, reasoning, evaluation" /></label></div>
      {!readOnly && duplicate && <div className="duplicate-warning"><strong>Possible duplicate</strong>{duplicate}</div>}
      {!readOnly && <div className="drawer-actions">{paper && <button type="button" className="danger" onClick={onDelete}>Delete</button>}<span />{paper?.url && <a className="secondary" href={paper.url} target="_blank" rel="noreferrer">Open Paper ↗</a>}<button type="submit" className="primary" disabled={saving}>{saving?'Saving…':paper?'Save changes':'Add Paper'}</button></div>}
      </fieldset>
      {readOnly && <div className="drawer-actions"><span />{paper?.url && <a className="secondary" href={paper.url} target="_blank" rel="noreferrer">Open Paper ↗</a>}<button type="button" className="primary" onClick={onClose}>Close</button></div>}
    </form>
  </aside></div>;
}
