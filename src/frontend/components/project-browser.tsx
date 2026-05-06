import { useEffect, useState } from "react";
import type { ProjectFileContentResponse, ProjectFilesResponse, ProjectSummary } from "../../shared/types";
import { getProjectFileContent, getProjectFiles } from "../api/client";

type ProjectBrowserProps = {
  codeServerUrl: string;
  project: ProjectSummary;
  onBack: () => void;
};

function getProjectIdeUrl(codeServerUrl: string, projectPath: string): string {
  const url = new URL(codeServerUrl);
  url.searchParams.set("folder", projectPath);

  return url.toString();
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) {
    return "-";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getBreadcrumbs(currentPath: string): Array<{ label: string; path: string }> {
  if (!currentPath) {
    return [];
  }

  const segments = currentPath.split("/").filter(Boolean);

  return segments.map((segment, index) => ({
    label: segment,
    path: segments.slice(0, index + 1).join("/")
  }));
}

export function ProjectBrowser({ codeServerUrl, project, onBack }: ProjectBrowserProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "loaded"; data: ProjectFilesResponse }
    | { status: "error"; message: string }
  >({ status: "loading" });
  const [fileState, setFileState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "loaded"; data: ProjectFileContentResponse }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const projectIdeUrl = getProjectIdeUrl(codeServerUrl, project.path);
  const breadcrumbs = getBreadcrumbs(currentPath);

  useEffect(() => {
    let isActive = true;

    setState({ status: "loading" });

    getProjectFiles(project.name, currentPath)
      .then((data) => {
        if (isActive) {
          setState({ status: "loaded", data });
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setState({ status: "error", message: error instanceof Error ? error.message : "Unable to load project files." });
        }
      });

    return () => {
      isActive = false;
    };
  }, [currentPath, project.name]);

  useEffect(() => {
    if (!selectedFilePath) {
      setFileState({ status: "idle" });
      return;
    }

    let isActive = true;

    setFileState({ status: "loading" });

    getProjectFileContent(project.name, selectedFilePath)
      .then((data) => {
        if (isActive) {
          setFileState({ status: "loaded", data });
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setFileState({ status: "error", message: error instanceof Error ? error.message : "Unable to load file preview." });
        }
      });

    return () => {
      isActive = false;
    };
  }, [project.name, selectedFilePath]);

  function openFolder(path: string): void {
    setSelectedFilePath(null);
    setCurrentPath(path);
  }

  return (
    <section className="panel project-browser">
      <div className="browser-header">
        <div>
          <nav className="browser-breadcrumbs" aria-label="Project folder navigation">
            <button type="button" onClick={onBack}>
              Projects
            </button>
            <span>/</span>
            <button type="button" onClick={() => openFolder("")}>
              {project.name}
            </button>
            {breadcrumbs.map((breadcrumb) => (
              <span key={breadcrumb.path} className="breadcrumb-item">
                <span>/</span>
                <button type="button" onClick={() => openFolder(breadcrumb.path)}>
                  {breadcrumb.label}
                </button>
              </span>
            ))}
          </nav>
          <h2>{project.name}</h2>
          <p>{currentPath ? `${project.path}/${currentPath}` : project.path}</p>
        </div>
        <a className="ide-button" href={projectIdeUrl} target="_blank" rel="noreferrer">
          Open in IDE
        </a>
      </div>

      {state.status === "loading" ? <p className="empty-state">Loading files...</p> : null}
      {state.status === "error" ? <p className="form-error">{state.message}</p> : null}

      {state.status === "loaded" ? (
        <div className="file-table-wrap">
          <table className="file-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {state.data.parentPath !== null ? (
                <tr>
                  <td>
                    <button className="file-link" type="button" onClick={() => openFolder(state.data.parentPath ?? "")}>
                      Parent folder
                    </button>
                  </td>
                  <td>Folder</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              ) : null}
              {state.data.entries.map((entry) => (
                <tr key={entry.path}>
                  <td>
                    {entry.type === "directory" ? (
                      <button className="file-link" type="button" onClick={() => openFolder(entry.path)}>
                        {entry.name}
                      </button>
                    ) : (
                      <button className="file-link file-link-muted" type="button" onClick={() => setSelectedFilePath(entry.path)}>
                        {entry.name}
                      </button>
                    )}
                  </td>
                  <td>{entry.type === "directory" ? "Folder" : "File"}</td>
                  <td>{formatBytes(entry.sizeBytes)}</td>
                  <td>{formatDate(entry.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {state.data.entries.length === 0 ? <p className="empty-state">This folder is empty.</p> : null}
        </div>
      ) : null}

      {selectedFilePath ? (
        <section className="file-preview" aria-label="File preview">
          <div className="file-preview-header">
            <div>
              <span>Preview</span>
              <h3>{selectedFilePath}</h3>
            </div>
            <button className="text-button" type="button" onClick={() => setSelectedFilePath(null)}>
              Close preview
            </button>
          </div>
          {fileState.status === "loading" ? <p className="empty-state">Loading preview...</p> : null}
          {fileState.status === "error" ? <p className="form-error">{fileState.message}</p> : null}
          {fileState.status === "loaded" ? (
            <pre className="code-preview">
              <code>{fileState.data.content}</code>
            </pre>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
