export type ResearcherKind = "researcher" | "resource";

export type Researcher = {
  id: number;
  name: string;
  affiliation: string;
  profileUrl: string;
  notes: string;
  kind: ResearcherKind;
  createdAt?: string;
  updatedAt?: string;
};

export type ResearcherForm = Omit<Researcher, "id" | "createdAt" | "updatedAt">;
