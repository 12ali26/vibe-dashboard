import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPort, getProjectsRoot, getWorkspaceRoots } from "../src/backend/config";

describe("backend config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the default local server port", () => {
    expect(getPort()).toBe(3000);
  });

  it("keeps the default projects root inside the allowed directory", () => {
    const projectPath = path.join("/home/ubuntu/projects", "example");

    vi.stubEnv("PROJECTS_ROOT", projectPath);

    expect(getProjectsRoot()).toBe(projectPath);
  });

  it("allows explicit workspace roots inside /home/ubuntu", () => {
    vi.stubEnv("WORKSPACE_ROOTS", "/home/ubuntu/projects,/home/ubuntu/apps");

    expect(getWorkspaceRoots()).toEqual(["/home/ubuntu/projects", "/home/ubuntu/apps"]);
  });

  it("deduplicates workspace roots", () => {
    vi.stubEnv("WORKSPACE_ROOTS", "/home/ubuntu/projects,/home/ubuntu/projects");

    expect(getWorkspaceRoots()).toEqual(["/home/ubuntu/projects"]);
  });

  it("rejects workspace roots outside /home/ubuntu", () => {
    vi.stubEnv("WORKSPACE_ROOTS", "/tmp");

    expect(() => getWorkspaceRoots()).toThrow("Workspace root is not allowed: /tmp");
  });

  it("rejects sensitive workspace roots", () => {
    vi.stubEnv("WORKSPACE_ROOTS", "/home/ubuntu/.ssh");

    expect(() => getWorkspaceRoots()).toThrow("Workspace root is not allowed: /home/ubuntu/.ssh");
  });

  it("rejects subdirectories of sensitive workspace roots", () => {
    vi.stubEnv("WORKSPACE_ROOTS", "/home/ubuntu/.config/code-server");

    expect(() => getWorkspaceRoots()).toThrow("Workspace root is not allowed: /home/ubuntu/.config/code-server");
  });
});
