'use client';
import React from 'react';

export default function ProjectsBar({
  email,
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
    <div className="user-area">
      <div className="status-line" id="authStatus">
        Signed in as {email} {status ? `• ${status}` : ''}
        <button style={{ marginLeft: 8 }} onClick={onRefresh}>↻ Refresh</button>
      </div>

      <select
        id="projectSelect"
        value={projectId}
        onChange={(e) => onChangeProject(e.target.value)}
      >
        <option value="">— Select project —</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <input
        id="newProjectName"
        type="text"
        placeholder="New project name"
        value={newProjectName}
        onChange={(e) => onChangeNewProjectName(e.target.value)}
      />

      <div style={{ display: 'inline-flex', gap: 8, marginTop: 8 }}>
        <button id="btnCreateProject" onClick={onCreateProject}>
          Create
        </button>
        <button
          id="btnDeleteProject"
          onClick={onDeleteProject}
          disabled={!projectId}
          style={{
            background: '#d32f2f',
            color: '#fff',
            border: 0,
            borderRadius: 4,
            padding: '6px 10px',
            opacity: projectId ? 1 : 0.5,
            cursor: projectId ? 'pointer' : 'not-allowed',
          }}
          title={projectId ? 'Delete selected project and all its files' : 'Select a project first'}
        >
          Delete Project
        </button>
      </div>
    </div>
  );
}
