import { type FormEvent, useState } from "react";
import type { ProjectSummary } from "../../shared/types";

type ProjectListProps = {
  codeServerUrl: string;
  projects: ProjectSummary[];
  projectsRoot: string;
  updatedAt: string;
  isSaving: boolean;
  errorMessage: string | null;
  onCreateProject: (name: string) => Promise<void>;
  onDeleteProject: (name: string) => Promise<void>;
  onSelectProject: (project: ProjectSummary) => void;
};

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function formatProjectType(type: ProjectSummary["type"]): string {
  if (type === "node") {
    return "Node";
  }

  if (type === "python") {
    return "Python";
  }

  if (type === "web") {
    return "Web";
  }

  return "Folder";
}

function ProjectRow({
  codeServerUrl,
  copiedValue,
  copyText,
  isSaving,
  onDeleteProject,
  onSelectProject,
  project
}: {
  codeServerUrl: string;
  copiedValue: string | null;
  copyText: (value: string) => Promise<void>;
  isSaving: boolean;
  onDeleteProject: (name: string) => Promise<void>;
  onSelectProject: (project: ProjectSummary) => void;
  project: ProjectSummary;
}) {
  const projectIdeUrl = getProjectIdeUrl(codeServerUrl, project.path);

  function confirmDelete(): void {
    const shouldDelete = window.confirm(`Delete "${project.name}" and everything inside it? This cannot be undone.`);

    if (shouldDelete) {
      void onDeleteProject(project.name);
    }
  }

  return (
    <li className="project-row">
      <div className="project-main">
        <h3>
          <button className="project-title-link" type="button" onClick={() => onSelectProject(project)}>
            {project.name}
          </button>
        </h3>
        <p>{project.path}</p>
        <div className="project-meta">
          <span>{formatProjectType(project.type)}</span>
          {project.git ? (
            <>
              <span>{project.git.branch}</span>
              <span>{project.git.hasChanges ? `${project.git.changedFiles} changed` : "Clean"}</span>
            </>
          ) : null}
        </div>
        {project.devCommands.length > 0 ? (
          <div className="command-list" aria-label={`${project.name} suggested commands`}>
            {project.devCommands.map((command) => (
              <button key={command} type="button" onClick={() => void copyText(command)}>
                {copiedValue === command ? "Copied" : command}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="project-badges">
        <span className={project.hasGit ? "status-pill status-ok" : "status-pill"}>
          {project.hasGit ? "Git" : "Folder"}
        </span>
        {project.git?.hasChanges ? <span className="status-pill status-warn">Dirty</span> : null}
        {project.git && !project.git.hasChanges ? <span className="status-pill status-clean">Clean</span> : null}
        <button className="copy-path-button" type="button" onClick={() => void copyText(project.path)}>
          {copiedValue === project.path ? "Copied" : "Copy path"}
        </button>
        <a className="project-ide-button" href={projectIdeUrl} target="_blank" rel="noreferrer">
          Open in IDE
        </a>
        <button className="copy-path-button" type="button" onClick={() => void copyText(`code-server ${project.path}`)}>
          {copiedValue === `code-server ${project.path}` ? "Copied" : "Open command"}
        </button>
        <button className="delete-button" type="button" onClick={confirmDelete} disabled={isSaving}>
          Delete
        </button>
      </div>
    </li>
  );
}

function getProjectIdeUrl(codeServerUrl: string, projectPath: string): string {
  const url = new URL(codeServerUrl);
  url.searchParams.set("folder", projectPath);

  return url.toString();
}

export function ProjectList({
  codeServerUrl,
  projects,
  projectsRoot,
  updatedAt,
  isSaving,
  errorMessage,
  onCreateProject,
  onDeleteProject,
  onSelectProject
}: ProjectListProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const projectCount = projects.length;

  async function submitProject(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const nextProjectName = projectName.trim();

    if (!nextProjectName) {
      return;
    }

    await onCreateProject(nextProjectName);
    setProjectName("");
  }

  async function copyText(value: string): Promise<void> {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(value);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiedValue(value);

    window.setTimeout(() => {
      setCopiedValue(null);
    }, 1800);
  }

  return (
    <section className="panel project-panel">
      <div className="panel-header">
        <h2>Projects</h2>
        <span>
          {projectCount} · Updated {formatUpdatedAt(updatedAt)}
        </span>
      </div>

      <form className="project-form" onSubmit={(event) => void submitProject(event)}>
        <label htmlFor="project-name">New project</label>
        <input
          id="project-name"
          type="text"
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          placeholder="my-new-project"
          autoComplete="off"
          disabled={isSaving}
        />
        <button type="submit" disabled={isSaving || !projectName.trim()}>
          {isSaving ? "Saving" : "Create"}
        </button>
      </form>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      {projectCount === 0 ? (
        <p className="empty-state">No project folders found.</p>
      ) : (
        <section className="project-group">
          <div className="project-group-header">
            <h3>{projectsRoot}</h3>
            <span>{projects.length}</span>
          </div>
          <ul className="project-list">
            {projects.map((project) => (
              <ProjectRow
                key={project.path}
                codeServerUrl={codeServerUrl}
                copiedValue={copiedValue}
                copyText={copyText}
                isSaving={isSaving}
                onDeleteProject={onDeleteProject}
                onSelectProject={onSelectProject}
                project={project}
              />
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
