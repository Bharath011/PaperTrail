import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { papers } from "../../../db/schema";
import { seedPapers } from "../../../db/seed-papers";

type Payload = { id?: number; title?: string; authors?: string; year?: string; section?: string; url?: string; remarks?: string; isRead?: number };
const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function GET() {
  try {
    const db = getDb();
    let rows = await db.select().from(papers).orderBy(desc(papers.createdAt), desc(papers.id));
    if (!rows.length) {
      await db.insert(papers).values(seedPapers.map((paper) => ({ ...paper })));
      rows = await db.select().from(papers).orderBy(papers.id);
    }
    return Response.json({ papers: rows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load papers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Payload;
    const title = clean(payload.title), section = clean(payload.section);
    if (!title || !section) return Response.json({ error: "Title and collection are required" }, { status: 400 });
    const [paper] = await getDb().insert(papers).values({ title, section, authors: clean(payload.authors), year: clean(payload.year), url: clean(payload.url), remarks: clean(payload.remarks) }).returning();
    return Response.json({ paper }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not add paper" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json() as Payload;
    if (!payload.id) return Response.json({ error: "Paper id is required" }, { status: 400 });
    const values: Record<string, string | number> = { updatedAt: new Date().toISOString() };
    for (const field of ["title", "authors", "year", "section", "url", "remarks"] as const) if (payload[field] !== undefined) values[field] = clean(payload[field]);
    if (payload.isRead !== undefined) values.isRead = payload.isRead ? 1 : 0;
    const [paper] = await getDb().update(papers).set(values).where(eq(papers.id, payload.id)).returning();
    return paper ? Response.json({ paper }) : Response.json({ error: "Paper not found" }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not update paper" }, { status: 500 });
  }
}
