import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { researchers } from "../../../db/schema";
import { seedResearchers } from "../../../db/seed-researchers";

type ResearcherKind = "researcher" | "resource";
type Payload = { id?: number; name?: string; affiliation?: string; profileUrl?: string; notes?: string; kind?: ResearcherKind };

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const normalizeUrl = (value: string) => value.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const kinds = new Set<ResearcherKind>(["researcher", "resource"]);

function valuesFrom(payload: Payload) {
  return {
    name: clean(payload.name),
    affiliation: clean(payload.affiliation),
    profileUrl: clean(payload.profileUrl),
    notes: clean(payload.notes),
    kind: payload.kind && kinds.has(payload.kind) ? payload.kind : "researcher",
  };
}

function validUrl(value: string) {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
}

async function probableDuplicate(name: string, profileUrl: string, ignoredId?: number) {
  const rows = await getDb().select({ id: researchers.id, name: researchers.name, profileUrl: researchers.profileUrl }).from(researchers);
  return rows.find((researcher) => researcher.id !== ignoredId && (
    normalize(researcher.name) === normalize(name) ||
    (profileUrl && researcher.profileUrl && normalizeUrl(researcher.profileUrl) === normalizeUrl(profileUrl))
  ));
}

export async function GET() {
  try {
    const db = getDb();
    let rows = await db.select().from(researchers).orderBy(desc(researchers.createdAt), researchers.name);
    if (!rows.length) {
      await db.insert(researchers).values(seedResearchers.map((researcher) => ({ ...researcher })));
      rows = await db.select().from(researchers).orderBy(researchers.name);
    }
    return Response.json({ researchers: rows });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not load researchers" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const values = valuesFrom(await request.json() as Payload);
    if (!values.name) return Response.json({ error: "Name is required" }, { status: 400 });
    if (!validUrl(values.profileUrl)) return Response.json({ error: "Use a valid http or https profile link" }, { status: 400 });
    const duplicate = await probableDuplicate(values.name, values.profileUrl);
    if (duplicate) return Response.json({ error: "Probable duplicate", duplicate }, { status: 409 });
    const [researcher] = await getDb().insert(researchers).values(values).returning();
    return Response.json({ researcher }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not add researcher" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json() as Payload;
    if (!payload.id) return Response.json({ error: "Researcher id is required" }, { status: 400 });
    const current = await getDb().select().from(researchers).where(eq(researchers.id, payload.id)).limit(1);
    if (!current[0]) return Response.json({ error: "Researcher not found" }, { status: 404 });
    const values = valuesFrom({ ...current[0], ...payload });
    if (!values.name) return Response.json({ error: "Name is required" }, { status: 400 });
    if (!validUrl(values.profileUrl)) return Response.json({ error: "Use a valid http or https profile link" }, { status: 400 });
    const duplicate = await probableDuplicate(values.name, values.profileUrl, payload.id);
    if (duplicate) return Response.json({ error: "Probable duplicate", duplicate }, { status: 409 });
    const [researcher] = await getDb().update(researchers).set({ ...values, updatedAt: new Date().toISOString() }).where(eq(researchers.id, payload.id)).returning();
    return Response.json({ researcher });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not update researcher" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json() as { id?: number };
    if (!id) return Response.json({ error: "Researcher id is required" }, { status: 400 });
    const [researcher] = await getDb().delete(researchers).where(eq(researchers.id, id)).returning();
    return researcher ? Response.json({ researcher }) : Response.json({ error: "Researcher not found" }, { status: 404 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not delete researcher" }, { status: 500 }); }
}
