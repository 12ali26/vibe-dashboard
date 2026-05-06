import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCodeServerPort, getCodeServerUrl, getPort, getProjectsRoot } from "../src/backend/config";

describe("backend config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the default local server port", () => {
    expect(getPort()).toBe(3000);
  });

  it("uses /home/ubuntu/projects as the default projects root", () => {
    const projectPath = path.join("/home/ubuntu/projects", "example");

    vi.stubEnv("PROJECTS_ROOT", projectPath);

    expect(getProjectsRoot()).toBe("/home/ubuntu/projects");
  });

  it("uses WORKSPACES_DIR when provided", () => {
    vi.stubEnv("WORKSPACES_DIR", "/workspaces");

    expect(getProjectsRoot()).toBe("/workspaces");
  });

  it("leaves the code-server URL empty when no override is configured", () => {
    expect(getCodeServerUrl()).toBe("");
  });

  it("uses SERVER_IP for the code-server URL when provided", () => {
    vi.stubEnv("SERVER_IP", "203.0.113.10");

    expect(getCodeServerUrl()).toBe("http://203.0.113.10:8080");
  });

  it("uses CODE_SERVER_PORT with SERVER_IP when provided", () => {
    vi.stubEnv("SERVER_IP", "203.0.113.10");
    vi.stubEnv("CODE_SERVER_PORT", "8443");

    expect(getCodeServerUrl()).toBe("http://203.0.113.10:8443");
  });

  it("defaults the code-server port to 8080 for local non-Docker runs", () => {
    expect(getCodeServerPort()).toBe(8080);
  });

  it("uses CODE_SERVER_URL before SERVER_IP when provided", () => {
    vi.stubEnv("CODE_SERVER_URL", "https://example.test/code-server");
    vi.stubEnv("SERVER_IP", "203.0.113.10");

    expect(getCodeServerUrl()).toBe("https://example.test/code-server");
  });
});
