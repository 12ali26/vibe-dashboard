import { useState } from "react";
import type { ProjectSummary } from "../../shared/types";

type ProjectGroup = {
  root: string;
  projects: ProjectSummary[];
};

type ProjectListProps = {
  projectGroups: ProjectGroup[];
  updatedAt: string;
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
  copiedValue,
  copyText,
  project
}: {
  copiedValue: string | null;
  copyText: (value: string) => Promise<void>;
  project: ProjectSummary;
}) {
  return (
    <li className="project-row">
      <div className="project-main">
        <h3>{project.name}</h3>
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
        <button className="copy-path-button" type="button" onClick={() => void copyText(`code-server ${project.path}`)}>
          {copiedValue === `code-server ${project.path}` ? "Copied" : "Open command"}
        </button>
      </div>
    </li>
  );
}

export function ProjectList({ projectGroups, updatedAt }: ProjectListProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const projectCount = projectGroups.reduce((total, group) => total + group.projects.length, 0);

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

      {projectCount === 0 ? (
        <p className="empty-state">No project folders found.</p>
      ) : (
        <div className="project-groups">
          {projectGroups.map((group) => (
            <section key={group.root} className="project-group">
              <div className="project-group-header">
                <h3>{group.root}</h3>
                <span>{group.projects.length}</span>
              </div>
              {group.projects.length === 0 ? (
                <p className="empty-state">No project folders found in this root.</p>
              ) : (
                <ul className="project-list">
                  {group.projects.map((project) => (
                    <ProjectRow key={project.path} copiedValue={copiedValue} copyText={copyText} project={project} />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
