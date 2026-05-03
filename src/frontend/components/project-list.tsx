import type { ProjectSummary } from "../../shared/types";

type ProjectListProps = {
  projects: ProjectSummary[];
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

export function ProjectList({ projects, updatedAt }: ProjectListProps) {
  return (
    <section className="panel project-panel">
      <div className="panel-header">
        <h2>Projects</h2>
        <span>
          {projects.length} · Updated {formatUpdatedAt(updatedAt)}
        </span>
      </div>

      {projects.length === 0 ? (
        <p className="empty-state">No project folders found.</p>
      ) : (
        <ul className="project-list">
          {projects.map((project) => (
            <li key={project.path} className="project-row">
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
              </div>
              <div className="project-badges">
                <span className={project.hasGit ? "status-pill status-ok" : "status-pill"}>
                  {project.hasGit ? "Git" : "Folder"}
                </span>
                {project.git?.hasChanges ? <span className="status-pill status-warn">Dirty</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
