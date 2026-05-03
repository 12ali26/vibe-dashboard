import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPort, getProjectsRoot } from "../src/backend/config";

describe("backend config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the default local server port", () => {
    expect(getPort()).toBe(3000);
  });

  it("keeps the projects root inside the allowed directory", () => {
    const projectPath = path.join("/home/ubuntu/projects", "example");

    vi.stubEnv("PROJECTS_ROOT", projectPath);

    expect(getProjectsRoot()).toBe(projectPath);
  });

  it("rejects project roots outside /home/ubuntu/projects", () => {
    vi.stubEnv("PROJECTS_ROOT", "/tmp");

    expect(() => getProjectsRoot()).toThrow("PROJECTS_ROOT must be inside /home/ubuntu/projects");
  });
});
