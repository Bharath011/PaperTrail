import { FormEvent } from "react";
import { Researcher, ResearcherForm } from "../researcher-types";

type Props = {
  researcher: Researcher | null;
  form: ResearcherForm;
  saving: boolean;
  duplicate: string;
  onChange: (form: ResearcherForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onDelete: () => void;
  readOnly?: boolean;
};

export default function ResearcherDrawer({ researcher, form, saving, duplicate, onChange, onClose, onSubmit, onDelete, readOnly = false }: Props) {
  return <div className="drawer-shell" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="drawer researcher-drawer" onSubmit={onSubmit}>
      <header className="drawer-head">
        <div><p>{readOnly ? "Shared directory details" : researcher ? "Edit directory entry" : "New directory entry"}</p><h2>{researcher ? researcher.name : form.kind === "resource" ? "Add a research resource" : "Add a researcher"}</h2></div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close">×</button>
      </header>
      <fieldset className="drawer-fields" disabled={readOnly}>
      {!readOnly && duplicate && <div className="duplicate-warning"><strong>Possible duplicate</strong>{duplicate}</div>}
      <section className="drawer-section">
        <h3>Profile details</h3>
        <div className="form-grid">
          <label className="full">Name<input required value={form.name} onChange={(event)=>onChange({...form,name:event.target.value})} placeholder="Researcher or resource name" /></label>
          <label>Entry type<select value={form.kind} onChange={(event)=>onChange({...form,kind:event.target.value as ResearcherForm["kind"]})}><option value="researcher">Researcher</option><option value="resource">Research resource</option></select></label>
          <label>Affiliation<input value={form.affiliation} onChange={(event)=>onChange({...form,affiliation:event.target.value})} placeholder="University, lab, or company" /></label>
          <label className="full">Profile link<input type="url" value={form.profileUrl} onChange={(event)=>onChange({...form,profileUrl:event.target.value})} placeholder="https://scholar.google.com/…" /></label>
          <label className="full">Notes<textarea value={form.notes} onChange={(event)=>onChange({...form,notes:event.target.value})} placeholder="Why you follow their work, topics, or recent papers…" /></label>
        </div>
      </section>
      {!readOnly && <footer className="drawer-actions">
        {researcher && <button type="button" className="danger" onClick={onDelete}>Delete</button>}
        <span />
        <button type="button" className="secondary" onClick={onClose}>Cancel</button>
        <button className="primary" disabled={saving}>{saving ? "Saving…" : researcher ? "Save changes" : form.kind === "resource" ? "Add resource" : "Add researcher"}</button>
      </footer>}
      </fieldset>
      {readOnly && <footer className="drawer-actions"><span /><button type="button" className="primary" onClick={onClose}>Close</button></footer>}
    </form>
  </div>;
}
