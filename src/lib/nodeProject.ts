import type { ServerResponse, ProjectResponse } from "./types";

/** Resolve only an exact backend server/project relationship; never infer ownership from names. */
export function resolveNodeProject(
  nodeId: string | null,
  servers: ServerResponse[],
  projects: ProjectResponse[],
): { id: string | null; name: string | null } {
  const id = servers.find((server) => server.id === nodeId)?.project_id || null;
  return { id, name: id ? projects.find((project) => project.id === id)?.name || null : null };
}
