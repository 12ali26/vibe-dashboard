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

export type ProjectFileEntry = {
  name: string;
  path: string;
  type: "file" | "directory";
  sizeBytes: number | null;
  updatedAt: string | null;
};

export type ProjectFilesResponse = {
  projectName: string;
  projectPath: string;
  currentPath: string;
  parentPath: string | null;
  entries: ProjectFileEntry[];
};

export type ProjectFileContentResponse = {
  projectName: string;
  projectPath: string;
  filePath: string;
  name: string;
  sizeBytes: number;
  updatedAt: string;
  content: string;
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
  projects: ProjectSummary[];
  system: SystemSummary;
  codeServerUrl: string;
  updatedAt: string;
};
