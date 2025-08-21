'use client';
import React from 'react';

export default function ProjectsBar({
  status,
  projects,
  projectId,
  newProjectName,
  onChangeProject,        // (value: string) => void
  onChangeNewProjectName, // (value: string) => void
  onCreateProject,        // () => void
  onDeleteProject,        // () => void
  onRefresh,              // () => void
}) {
  return (
    <div className="ui-bar projects-bar" role="region" aria-label="Projects bar">
      {/* status (truncate to avoid pushing controls) */}
      {status ? (
        <span
          style={{
            fontSize: 12,
            opacity: 0.9,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 280,
          }}
          title={status}
        >
          • {status}
        </span>
      ) : null}

      {/* refresh */}
      <button className="ui-btn" onClick={onRefresh} type="button" title="Refresh projects">
        ↻ Refresh
      </button>

      {/* project select */}
      <select
        className="ui-select"
        id="projectSelect"
        aria-label="Select project"
        value={projectId}
        onChange={(e) => onChangeProject(e.target.value)}
        style={{ minWidth: 220 }}
      >
        <option value="">— Select project —</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* new project input */}
      <input
        className="ui-input"
        id="newProjectName"
        type="text"
        placeholder="New project name"
        aria-label="New project name"
        value={newProjectName}
        onChange={(e) => onChangeNewProjectName(e.target.value)}
        style={{ width: 240 }}
      />

      {/* actions */}
      <button className="ui-btn" id="btnCreateProject" onClick={onCreateProject} type="button">
        Create
      </button>

      <button
        className="ui-btn ui-btn--danger"
        id="btnDeleteProject"
        onClick={onDeleteProject}
        type="button"
        disabled={!projectId}
        title={projectId ? 'Delete selected project and all its files' : 'Select a project first'}
      >
        Delete Project
      </button>
    </div>
  );
}
