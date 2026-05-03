export type HealthResponse = {
  ok: true;
  service: "vibe-dashboard";
};

export type ProjectSummary = {
  name: string;
  path: string;
  hasGit: boolean;
};

export type SystemSummary = {
  platform: string;
  uptimeSeconds: number;
  memory: {
    totalBytes: number;
    freeBytes: number;
  };
  cpuCount: number;
};

export type DashboardResponse = {
  projectsRoot: string;
  projects: ProjectSummary[];
  system: SystemSummary;
};
