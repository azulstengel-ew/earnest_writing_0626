import { db } from "../db";
import { projects } from "../db/schema";
import { eq, and } from "drizzle-orm";
import type { DbProject } from "../db/schema";
import type { Project } from "../projects-store";

function dbToProject(row: DbProject): Project {
  return {
    id: row.id,
    title: row.title,
    type: row.type as Project["type"],
    theme: row.theme as Project["theme"],
    premise: row.premise,
    target: row.target,
    weeklyWordTarget: row.weeklyWordTarget,
    archived: row.archived,
    framework: row.framework as Project["framework"],
    customActs: (row.customActs as Project["customActs"]) ?? [],
    customBeats: (row.customBeats as Project["customBeats"]) ?? [],
    tensionCurve: (row.tensionCurve as number[]) ?? [],
    chapters: (row.chapters as Project["chapters"]) ?? [],
    characters: (row.characters as Project["characters"]) ?? [],
    connections: (row.connections as Project["connections"]) ?? [],
    arcs: (row.arcs as Project["arcs"]) ?? [],
    events: (row.events as Project["events"]) ?? [],
    researchSnippets: (row.researchSnippets as Project["researchSnippets"]) ?? [],
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getProjectsForUser(userId: number): Promise<Project[]> {
  const rows = await db.select().from(projects).where(eq(projects.userId, userId));
  return rows.map(dbToProject).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProjectForUser(userId: number, projectId: string): Promise<Project | undefined> {
  const [row] = await db.select().from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)));
  return row ? dbToProject(row) : undefined;
}

export async function upsertProject(userId: number, project: Project): Promise<Project> {
  const [row] = await db.insert(projects).values({
    id: project.id,
    userId,
    title: project.title,
    type: project.type,
    theme: project.theme,
    premise: project.premise,
    target: project.target,
    weeklyWordTarget: project.weeklyWordTarget,
    archived: project.archived,
    framework: project.framework,
    customActs: project.customActs as never,
    customBeats: project.customBeats as never,
    tensionCurve: project.tensionCurve as never,
    chapters: project.chapters as never,
    characters: project.characters as never,
    connections: project.connections as never,
    arcs: project.arcs as never,
    events: project.events as never,
    researchSnippets: project.researchSnippets as never,
    createdAt: new Date(project.createdAt),
  }).onConflictDoUpdate({
    target: projects.id,
    set: {
      title: project.title,
      type: project.type,
      theme: project.theme,
      premise: project.premise,
      target: project.target,
      weeklyWordTarget: project.weeklyWordTarget,
      archived: project.archived,
      framework: project.framework,
      customActs: project.customActs as never,
      customBeats: project.customBeats as never,
      tensionCurve: project.tensionCurve as never,
      chapters: project.chapters as never,
      characters: project.characters as never,
      connections: project.connections as never,
      arcs: project.arcs as never,
      events: project.events as never,
      researchSnippets: project.researchSnippets as never,
    },
  }).returning();
  return dbToProject(row);
}

export async function deleteProjectForUser(userId: number, projectId: string): Promise<void> {
  await db.delete(projects).where(and(eq(projects.userId, userId), eq(projects.id, projectId)));
}
