import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCodeServerUrl, getPort, getProjectsRoot } from "../src/backend/config";

describe("backend config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the default local server port", () => {
    expect(getPort()).toBe(3000);
  });

  it("uses /home/ubuntu/projects as the only projects root", () => {
    const projectPath = path.join("/home/ubuntu/projects", "example");

    vi.stubEnv("PROJECTS_ROOT", projectPath);

    expect(getProjectsRoot()).toBe("/home/ubuntu/projects");
  });

  it("leaves the code-server URL empty when no override is configured", () => {
    expect(getCodeServerUrl()).toBe("");
  });

  it("uses SERVER_IP for the code-server URL when provided", () => {
    vi.stubEnv("SERVER_IP", "203.0.113.10");

    expect(getCodeServerUrl()).toBe("http://203.0.113.10:8080");
  });

  it("uses CODE_SERVER_URL before SERVER_IP when provided", () => {
    vi.stubEnv("CODE_SERVER_URL", "https://example.test/code-server");
    vi.stubEnv("SERVER_IP", "203.0.113.10");

    expect(getCodeServerUrl()).toBe("https://example.test/code-server");
  });
});
