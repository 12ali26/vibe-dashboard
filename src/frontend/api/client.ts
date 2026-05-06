import type {
  DashboardResponse,
  DevServerSummary,
  HealthResponse,
  ProjectFileContentResponse,
  ProjectFilesResponse,
  ProjectSummary
} from "../../shared/types";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };

    if (body.error) {
      return body.error;
    }
  } catch {
    // Fall through to the generic status message.
  }

  return `Request failed with ${response.status}`;
}

async function sendJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>("api/health");
}

export function getDashboard(): Promise<DashboardResponse> {
  return getJson<DashboardResponse>("api/dashboard");
}

export function getProjectFiles(projectName: string, relativePath = ""): Promise<ProjectFilesResponse> {
  const params = new URLSearchParams();

  if (relativePath) {
    params.set("path", relativePath);
  }

  const query = params.toString();

  return getJson<ProjectFilesResponse>(`api/projects/${encodeURIComponent(projectName)}/files${query ? `?${query}` : ""}`);
}

export function getProjectFileContent(projectName: string, relativePath: string): Promise<ProjectFileContentResponse> {
  const params = new URLSearchParams({ path: relativePath });

  return getJson<ProjectFileContentResponse>(`api/projects/${encodeURIComponent(projectName)}/file?${params.toString()}`);
}

export function getDevServer(projectName: string): Promise<DevServerSummary> {
  return getJson<DevServerSummary>(`api/projects/${encodeURIComponent(projectName)}/dev-server`);
}

export function startDevServer(projectName: string): Promise<DevServerSummary> {
  return sendJson<DevServerSummary>(`api/projects/${encodeURIComponent(projectName)}/dev-server/start`, {
    method: "POST"
  });
}

export function stopDevServer(projectName: string): Promise<DevServerSummary> {
  return sendJson<DevServerSummary>(`api/projects/${encodeURIComponent(projectName)}/dev-server/stop`, {
    method: "POST"
  });
}

export function createProject(name: string): Promise<ProjectSummary> {
  return sendJson<ProjectSummary>("api/projects", {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export function deleteProject(name: string): Promise<void> {
  return sendJson<void>(`api/projects/${encodeURIComponent(name)}`, {
    method: "DELETE"
  });
}
