import { Researcher } from "../researcher-types";

type Props = {
  researchers: readonly Researcher[];
  query: string;
  onAdd: () => void;
  onAddResource: () => void;
  onEdit: (researcher: Researcher) => void;
  readOnly?: boolean;
};

export default function ResearcherDirectory({ researchers, query, onAdd, onAddResource, onEdit, readOnly = false }: Props) {
  const visible = researchers.filter((researcher) => `${researcher.name} ${researcher.affiliation} ${researcher.notes}`.toLowerCase().includes(query.toLowerCase()));
  const people = visible.filter((researcher) => researcher.kind !== "resource");
  const resources = visible.filter((researcher) => researcher.kind === "resource");

  const card = (researcher: Researcher) => <article className="researcher-card" key={researcher.id}>
    <div className={`researcher-avatar ${researcher.kind}`}>{researcher.kind === "resource" ? "⌘" : researcher.name.split(/\s+/).slice(0,2).map((part)=>part[0]).join("").toUpperCase()}</div>
    <div className="researcher-copy">
      <h3>{researcher.profileUrl ? <a href={researcher.profileUrl} target="_blank" rel="noreferrer">{researcher.name}<span>↗</span></a> : researcher.name}</h3>
      <p>{researcher.affiliation || "Affiliation not listed"}</p>
      {researcher.notes && <small>{researcher.notes}</small>}
    </div>
    <div className="researcher-actions">
      {researcher.profileUrl ? <a className="profile-action" href={researcher.profileUrl} target="_blank" rel="noreferrer">View {researcher.kind === "resource" ? "resource" : "profile"}</a> : <span className="profile-missing">No profile link</span>}
      {!readOnly && <button type="button" className="edit-researcher" onClick={()=>onEdit(researcher)} aria-label={`Edit ${researcher.name}`}>Edit</button>}
    </div>
  </article>;

  return <section className="researcher-directory">
    <div className="researcher-intro">
      <div><p className="eyebrow">Research network</p><h2>People to Follow</h2><p>Keep track of active researchers, labs, and curators whose work matters to your field.</p></div>
      <div className="researcher-intro-actions"><span>{visible.length} profiles</span>{!readOnly && <button className="primary" onClick={onAdd}><b>+</b> Add researcher</button>}</div>
    </div>
    <div className="researcher-grid">{people.map(card)}</div>
    <div className="resource-heading"><div><p className="eyebrow">Curated sources</p><h3>Research resources</h3></div>{!readOnly && <button className="secondary" onClick={onAddResource}><b>+</b> Add resource</button>}</div>
    {resources.length ? <div className="researcher-grid resources">{resources.map(card)}</div> : <div className="resource-empty"><p>No research resources added yet.</p>{!readOnly && <button onClick={onAddResource}>Add your first resource</button>}</div>}
    {!visible.length && <div className="empty"><span>◎</span><strong>No researchers match this search</strong><p>Try another keyword or add a new researcher.</p>{!readOnly && <button className="primary" onClick={onAdd}>+ Add researcher</button>}</div>}
  </section>;
}
