export type HealthResponse = {
  ok: true;
  service: "vibe-dashboard";
};

export type ProjectSummary = {
  name: string;
  path: string;
  type: "node" | "python" | "web" | "unknown";
  hasGit: boolean;
  git?: {
    branch: string;
    hasChanges: boolean;
    changedFiles: number;
  };
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
  updatedAt: string;
};
