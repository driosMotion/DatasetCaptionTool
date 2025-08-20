'use client';

import { useEffect, useState } from 'react';

/**
 * Projects data hook.
 * Manages list/selection/create/delete. Also refreshes when `ready` flips true.
 */
export default function useProjects({ supabase, BUCKET, setStatus, ready }) {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');

  const fetchProjects = async () => {
    setStatus?.('Refreshing projects…');
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return setStatus?.(error.message);
    setProjects(data || []);
    setProjectId((prev) => (data?.some((p) => p.id === prev) ? prev : ''));
    setStatus?.(`Loaded ${data?.length ?? 0} project(s)`);
  };

  useEffect(() => {
    if (ready) fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const createProject = async () => {
    const name = newProjectName.trim();
    if (!name) return setStatus?.('Project name required');

    setStatus?.('Creating project…');
    const { data, error } = await supabase
      .from('projects')
      .insert({ name })
      .select()
      .single();

    if (error) return setStatus?.(error.message);

    await fetchProjects();
    setProjectId(data.id);
    setNewProjectName('');
    setStatus?.(`Project "${data.name}" created`);
  };

  /**
   * Delete project + all its image rows + storage files.
   * Accepts optional onDeleted callback to let the caller clear UI (e.g., gallery).
   */
  const deleteProject = async ({ onDeleted } = {}) => {
    if (!projectId) return setStatus?.('Select a project first');

    const proj = projects.find((p) => p.id === projectId);
    const name = proj?.name || projectId;
    const ok = confirm(
      `Delete project "${name}" and ALL of its images and stored files?\nThis cannot be undone.`
    );
    if (!ok) return;

    setStatus?.('Deleting project…');

    // 1) Fetch associated images (ids + storage keys)
    const { data: imgs, error: imgErr } = await supabase
      .from('images')
      .select('id, s3_key')
      .eq('project_id', projectId);
    if (imgErr) return setStatus?.(imgErr.message);

    // 2) Remove storage files in chunks
    const keys = (imgs || []).map((i) => i.s3_key).filter(Boolean);
    const CHUNK = 100;
    for (let i = 0; i < keys.length; i += CHUNK) {
      const slice = keys.slice(i, i + CHUNK);
      if (slice.length) {
        const { error: stErr } = await supabase.storage.from(BUCKET).remove(slice);
        if (stErr) return setStatus?.(stErr.message);
      }
    }

    // 3) Delete image rows
    const { error: delImgErr } = await supabase
      .from('images')
      .delete()
      .eq('project_id', projectId);
    if (delImgErr) return setStatus?.(delImgErr.message);

    // 4) Delete the project row
    const { error: projErr } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    if (projErr) return setStatus?.(projErr.message);

    // 5) UI refresh
    setProjectId('');
    await fetchProjects();
    onDeleted?.(); // caller can clear images, preview, etc.
    setStatus?.(`Project "${name}" deleted`);
  };

  return {
    // state
    projects,
    projectId, setProjectId,
    newProjectName, setNewProjectName,
    // actions
    fetchProjects,
    createProject,
    deleteProject,
  };
}
