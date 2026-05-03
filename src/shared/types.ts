export type HealthResponse = {
  ok: true;
  service: "vibe-dashboard";
};

export type ProjectSummary = {
  name: string;
  path: string;
  root: string;
  type: "node" | "python" | "web" | "unknown";
  devCommands: string[];
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
  cpuUsagePercent: number;
  memory: {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
    usagePercent: number;
  };
  disk: {
    path: string;
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    usagePercent: number;
  };
  cpuCount: number;
};

export type DashboardResponse = {
  projectsRoot: string;
  workspaceRoots: string[];
  projectGroups: Array<{
    root: string;
    projects: ProjectSummary[];
  }>;
  projects: ProjectSummary[];
  system: SystemSummary;
  updatedAt: string;
};
