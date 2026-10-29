"use client";

import type { ProjectGeneration } from "@/lib/types";

export interface LocalProject {
  id: string;
  name: string;
  board_id: string;
  generation: ProjectGeneration | null;
  updated_at: string;
}

const STORAGE_KEY = "tryvio:projects:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

/** Subscribe to local project list changes (same-tab + cross-tab). */
export function subscribeLocalProjects(cb: Listener): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function readAll(): LocalProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(projects: LocalProject[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    notify();
  } catch {
    // storage full or unavailable — generation still works, just not persisted
  }
}

export function listLocalProjects(): LocalProject[] {
  return readAll().sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

/** Stable snapshot for useSyncExternalStore — sorted, cached by content identity. */
let projectsCache: LocalProject[] = [];
let projectsCacheKey = "";

export function getLocalProjectsSnapshot(): LocalProject[] {
  const next = listLocalProjects();
  const key = next.map((p) => `${p.id}:${p.updated_at}`).join("|");
  if (key !== projectsCacheKey) {
    projectsCache = next;
    projectsCacheKey = key;
  }
  return projectsCache;
}

/** Stable empty snapshot for SSR — a module-level cached reference.
 * Never return `[]` inline here: useSyncExternalStore requires
 * getServerSnapshot to return a cached value to avoid an infinite loop. */
const EMPTY_PROJECTS_SNAPSHOT: LocalProject[] = [];

export function getLocalProjectsServerSnapshot(): LocalProject[] {
  return EMPTY_PROJECTS_SNAPSHOT;
}

export function getLocalProject(id: string): LocalProject | null {
  return readAll().find((p) => p.id === id) ?? null;
}

export function saveLocalProject(input: {
  id: string;
  name: string;
  board_id: string;
  generation: ProjectGeneration | null;
}): LocalProject | null {
  const all = readAll();
  const now = new Date().toISOString();
  const existingIdx = all.findIndex((p) => p.id === input.id);
  const existing = existingIdx >= 0 ? all[existingIdx] : null;
  const generation = input.generation ?? existing?.generation ?? null;

  // Never create a project until real generation data exists.
  if (!existing && !generation) return null;

  if (existingIdx >= 0) {
    const updated: LocalProject = {
      ...existing!,
      name: input.name,
      board_id: input.board_id,
      generation,
      updated_at: now,
    };
    all[existingIdx] = updated;
    writeAll(all);
    return updated;
  }

  const created: LocalProject = {
    id: input.id,
    name: input.name,
    board_id: input.board_id,
    generation,
    updated_at: now,
  };
  all.push(created);
  writeAll(all);
  return created;
}
