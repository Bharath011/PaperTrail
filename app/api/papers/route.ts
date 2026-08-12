import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { papers } from "../../../db/schema";
import { seedPapers } from "../../../db/seed-papers";

type ReadingStatus = "to-read" | "reading" | "completed";
type Payload = {
  id?: number; title?: string; authors?: string; year?: string; section?: string;
  venue?: string; url?: string; status?: ReadingStatus; remarks?: string;
  keyTakeaways?: string; limitations?: string; connections?: string; tags?: string;
  focusThisWeek?: number;
};

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const statuses = new Set<ReadingStatus>(["to-read", "reading", "completed"]);
const normalizeTitle = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const normalizeUrl = (value: string) => value.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function valuesFrom(payload: Payload) {
  const status = payload.status && statuses.has(payload.status) ? payload.status : "to-read";
  return {
    title: clean(payload.title), authors: clean(payload.authors), year: clean(payload.year),
    section: clean(payload.section), venue: clean(payload.venue), url: clean(payload.url), status,
    remarks: clean(payload.remarks), keyTakeaways: clean(payload.keyTakeaways),
    limitations: clean(payload.limitations), connections: clean(payload.connections), tags: clean(payload.tags),
    focusThisWeek: payload.focusThisWeek ? 1 : 0,
    isRead: status === "completed" ? 1 : 0,
    completedAt: status === "completed" ? new Date().toISOString() : null,
  };
}

async function probableDuplicate(title: string, url: string, ignoredId?: number) {
  const rows = await getDb().select({ id: papers.id, title: papers.title, url: papers.url }).from(papers);
  return rows.find((paper) => paper.id !== ignoredId && (
    (url && paper.url && normalizeUrl(paper.url) === normalizeUrl(url)) ||
    normalizeTitle(paper.title) === normalizeTitle(title)
  ));
}

export async function GET() {
  try {
    const db = getDb();
    let rows = await db.select().from(papers).orderBy(desc(papers.createdAt), desc(papers.id));
    if (!rows.length) {
      const initial = seedPapers.map((paper) => ({ ...paper, venue: "", status: "to-read", keyTakeaways: "", limitations: "", connections: "", tags: "", focusThisWeek: 0 }));
      for (let index = 0; index < initial.length; index += 10) await db.insert(papers).values(initial.slice(index, index + 10));
      rows = await db.select().from(papers).orderBy(papers.id);
    }
    return Response.json({ papers: rows });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not load papers" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Payload;
    const values = valuesFrom(payload);
    if (!values.title || !values.section) return Response.json({ error: "Title and category are required" }, { status: 400 });
    const duplicate = await probableDuplicate(values.title, values.url);
    if (duplicate) return Response.json({ error: "Probable duplicate", duplicate }, { status: 409 });
    const [paper] = await getDb().insert(papers).values(values).returning();
    return Response.json({ paper }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not add paper" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json() as Payload;
    if (!payload.id) return Response.json({ error: "Paper id is required" }, { status: 400 });
    const updates: Record<string, string | number | null> = { updatedAt: new Date().toISOString() };
    for (const field of ["title", "authors", "year", "section", "venue", "url", "remarks", "keyTakeaways", "limitations", "connections", "tags"] as const) {
      if (payload[field] !== undefined) updates[field] = clean(payload[field]);
    }
    if (payload.focusThisWeek !== undefined) updates.focusThisWeek = payload.focusThisWeek ? 1 : 0;
    if (payload.status !== undefined && statuses.has(payload.status)) {
      updates.status = payload.status; updates.isRead = payload.status === "completed" ? 1 : 0;
      updates.completedAt = payload.status === "completed" ? new Date().toISOString() : null;
    }
    if (payload.title || payload.url) {
      const current = await getDb().select().from(papers).where(eq(papers.id, payload.id)).limit(1);
      const duplicate = await probableDuplicate(clean(payload.title) || current[0]?.title || "", clean(payload.url) || current[0]?.url || "", payload.id);
      if (duplicate) return Response.json({ error: "Probable duplicate", duplicate }, { status: 409 });
    }
    const [paper] = await getDb().update(papers).set(updates).where(eq(papers.id, payload.id)).returning();
    return paper ? Response.json({ paper }) : Response.json({ error: "Paper not found" }, { status: 404 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not update paper" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json() as { id?: number };
    if (!id) return Response.json({ error: "Paper id is required" }, { status: 400 });
    const [paper] = await getDb().delete(papers).where(eq(papers.id, id)).returning();
    return paper ? Response.json({ paper }) : Response.json({ error: "Paper not found" }, { status: 404 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not delete paper" }, { status: 500 }); }
}
