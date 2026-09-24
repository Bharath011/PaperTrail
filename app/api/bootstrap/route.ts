import { eq } from "drizzle-orm";
import { seedPapers } from "../../../db/seed-papers";
import { seedResearchers } from "../../../db/seed-researchers";
import { appState, papers as paperTable, researchers as researcherTable } from "../../../db/schema";
import { getDb } from "../../../db";
import type { Paper } from "../../papertrail-types";
import type { Researcher } from "../../researcher-types";

function paperValues(value: Partial<Paper>) {
  const status = value.status === "reading" || value.status === "completed" ? value.status : "to-read";
  return {
    id: Number.isInteger(value.id) && value.id! > 0 ? value.id : undefined,
    title: typeof value.title === "string" ? value.title.slice(0, 1000) : "",
    authors: typeof value.authors === "string" ? value.authors.slice(0, 2000) : "",
    year: typeof value.year === "string" ? value.year.slice(0, 20) : "",
    section: typeof value.section === "string" ? value.section.slice(0, 200) : "General",
    venue: typeof value.venue === "string" ? value.venue.slice(0, 1000) : "",
    url: typeof value.url === "string" ? value.url.slice(0, 2000) : "",
    status,
    remarks: typeof value.remarks === "string" ? value.remarks.slice(0, 10000) : "",
    keyTakeaways: typeof value.keyTakeaways === "string" ? value.keyTakeaways.slice(0, 10000) : "",
    limitations: typeof value.limitations === "string" ? value.limitations.slice(0, 10000) : "",
    connections: typeof value.connections === "string" ? value.connections.slice(0, 10000) : "",
    tags: typeof value.tags === "string" ? value.tags.slice(0, 2000) : "",
    focusThisWeek: value.focusThisWeek ? 1 : 0,
    isRead: status === "completed" ? 1 : 0,
    completedAt: typeof value.completedAt === "string" ? value.completedAt : null,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
}

function researcherValues(value: Partial<Researcher>) {
  return {
    id: Number.isInteger(value.id) && value.id! > 0 ? value.id : undefined,
    name: typeof value.name === "string" ? value.name.slice(0, 500) : "",
    affiliation: typeof value.affiliation === "string" ? value.affiliation.slice(0, 1000) : "",
    profileUrl: typeof value.profileUrl === "string" ? value.profileUrl.slice(0, 2000) : "",
    notes: typeof value.notes === "string" ? value.notes.slice(0, 10000) : "",
    kind: value.kind === "resource" ? "resource" : "researcher",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
}

function rows<T>(value: unknown): T[] | null {
  return Array.isArray(value) ? value.filter((row) => row && typeof row === "object") as T[] : null;
}

export async function POST(request: Request) {
  const db = getDb();
  try {
    const payload = await request.json() as { papers?: unknown; researchers?: unknown };
    const legacyPapers = rows<Partial<Paper>>(payload.papers);
    const legacyResearchers = rows<Partial<Researcher>>(payload.researchers);
    if ((legacyPapers?.length ?? 0) > 1000 || (legacyResearchers?.length ?? 0) > 1000) {
      return Response.json({ error: "Legacy library is too large to import" }, { status: 413 });
    }

    const [claimed] = await db.insert(appState).values({ key: "shared-library-v1", value: "initialized" }).onConflictDoNothing().returning();
    if (!claimed) return Response.json({ imported: false });

    const importedPapers = legacyPapers ?? seedPapers.map((paper, index) => ({ ...paper, id:index + 1 }));
    const importedResearchers = legacyResearchers ?? seedResearchers.map((researcher, index) => ({ ...researcher, id:index + 1 }));
    const operations = [
      db.delete(paperTable),
      ...importedPapers.filter((paper) => typeof paper.title === "string" && paper.title.trim()).map((paper) => db.insert(paperTable).values(paperValues(paper))),
      db.delete(researcherTable),
      ...importedResearchers.filter((researcher) => typeof researcher.name === "string" && researcher.name.trim()).map((researcher) => db.insert(researcherTable).values(researcherValues(researcher))),
    ];
    await db.batch(operations as [typeof operations[number], ...typeof operations[number][]]);
    return Response.json({ imported: true });
  } catch (error) {
    await db.delete(appState).where(eq(appState.key, "shared-library-v1")).catch(() => undefined);
    return Response.json({ error: error instanceof Error ? error.message : "Could not initialize the shared library" }, { status: 500 });
  }
}
