import type { DashboardResponse, HealthResponse } from "../../shared/types";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>("api/health");
}

export function getDashboard(): Promise<DashboardResponse> {
  return getJson<DashboardResponse>("api/dashboard");
}
