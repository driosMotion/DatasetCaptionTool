'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { uploadFiles, downloadZip, findDuplicates, renameFiles } from '@/app/app/lib/media';

/**
 * Images data hook.
 * Handles list, uploads (file input + DnD), delete, caption updates, bulk ops,
 * and gives wrappers for zip/rename/duplicates.
 */
export default function useImages({ supabase, BUCKET, setStatus }) {
  const [images, setImages] = useState([]);
  const [pendingCaptions, setPendingCaptions] = useState({}); // baseName -> text
  const [lastFocusedImageId, setLastFocusedImageId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // -------- fetch list
  const fetchImages = useCallback(async (projectId) => {
    if (!projectId) { setImages([]); return; }
    setStatus?.('Loading images…');

    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) return setStatus?.(error.message);

    const withUrls = await Promise.all(
      (data || []).map(async (rec) => {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(rec.s3_key, 3600);
        return { ...rec, url: signed?.signedUrl };
      })
    );

    withUrls.sort((a, b) => {
      const nameA = (a.original_name || a.s3_key.split('/').pop() || '').toLowerCase();
      const nameB = (b.original_name || b.s3_key.split('/').pop() || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    setImages(withUrls);
    setStatus?.(`Loaded ${withUrls.length} image(s)`);
  }, [BUCKET, supabase, setStatus]);

  // -------- uploads: input change + DnD
  const handleFileInputChange = useCallback(async (e, projectId) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) { setStatus?.('No files selected'); return; }
      setStatus?.(`Selected ${files.length} file(s)`);
      await uploadFiles({
        fileList: files,
        projectId,
        BUCKET,
        pendingCaptions,
        images,
        setImages,
        setPendingCaptions,
        setStatus,
        supabase,
        fetchImages: (pid) => fetchImages(pid || projectId),
      });
    } catch (err) {
      setStatus?.(`File select error: ${String(err?.message || err)}`);
    }
  }, [BUCKET, images, pendingCaptions, supabase, setStatus, fetchImages]);

  const handleDrop = useCallback(async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    const files = dt?.files;
    await uploadFiles({
      fileList: files,
      projectId,
      BUCKET,
      pendingCaptions,
      images,
      setImages,
      setPendingCaptions,
      setStatus,
      supabase,
      fetchImages: (pid) => fetchImages(pid || projectId),
    });
  }, [BUCKET, images, pendingCaptions, supabase, setStatus, fetchImages]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);

  // -------- delete single image
  const deleteImage = useCallback(async (img, opts = {}) => {
    const { skipConfirm = false } = opts;
    if (!skipConfirm) {
      if (!confirm(`Delete "${img.original_name || img.s3_key.split('/').pop()}"?`)) return;
    }
    setStatus?.('Deleting…');

    const { error: dbErr } = await supabase.from('images').delete().eq('id', img.id);
    if (dbErr) return setStatus?.(dbErr.message);

    const { error: stErr } = await supabase.storage.from(BUCKET).remove([img.s3_key]);
    if (stErr) return setStatus?.(stErr.message);

    setImages((prev) => prev.filter((i) => i.id !== img.id));
    setStatus?.('Deleted');
  }, [BUCKET, supabase, setStatus]);

  // -------- debounced caption save
  const saveTimerRef = useRef(null);
  const captionChange = useCallback((id, text) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, caption: text } : img)));
    setStatus?.('Saving…');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase.from('images').update({ caption: text }).eq('id', id);
      setStatus?.(error ? error.message : 'Caption saved');
    }, 600);
  }, [supabase, setStatus]);

  // -------- bulk caption helpers
  const addPrefix = useCallback(async ({ projectId, targetId }) => {
    if (!projectId) return setStatus?.('Select a project first');

    const prefix = (prompt('Word to add at the beginning of caption(s):') || '').trim();
    if (!prefix) return;

    const targetIds = targetId ? [targetId] : images.map((img) => img.id);
    if (targetIds.length === 0) return setStatus?.('No images to update');

    setStatus?.(`Adding "${prefix}" to ${targetIds.length} caption(s)…`);

    // optimistic
    setImages((prev) =>
      prev.map((img) =>
        targetIds.includes(img.id)
          ? { ...img, caption: (img.caption ? `${prefix} ${img.caption}` : prefix).trim() }
          : img
      )
    );

    for (const id of targetIds) {
      const curr = images.find((i) => i.id === id)?.caption || '';
      const next = (curr ? `${prefix} ${curr}` : prefix).trim();
      const { error } = await supabase.from('images').update({ caption: next }).eq('id', id);
      if (error) { setStatus?.(`Error updating captions: ${error.message}`); return; }
    }
    setStatus?.(`Added "${prefix}" to ${targetIds.length} caption(s)`);
  }, [images, supabase, setStatus]);

  const searchReplace = useCallback(async ({ projectId }) => {
    if (!projectId) return setStatus?.('Select a project first');

    const find = prompt('Find text in captions:');
    if (find == null || find === '') return;
    const replace = prompt(`Replace "${find}" with:`, '');
    if (replace == null) return;

    let changed = 0;
    const next = images.map((img) => {
      const cap = img.caption || '';
      if (cap.includes(find)) {
        changed++;
        return { ...img, caption: cap.split(find).join(replace) };
      }
      return img;
    });
    if (changed === 0) return setStatus?.('No captions matched.');
    setImages(next);
    setStatus?.(`Replacing in ${changed} caption(s)…`);

    for (const img of next) {
      const old = images.find((i) => i.id === img.id)?.caption || '';
      if (old !== img.caption) {
        const { error } = await supabase.from('images').update({ caption: img.caption || '' }).eq('id', img.id);
        if (error) return setStatus?.(error.message);
      }
    }
    setStatus?.('Search & Replace complete');
  }, [images, supabase, setStatus]);

  // -------- wrappers for lib actions (keep page ultra-thin)
  const downloadZipAction = useCallback(async ({ projectId }) => {
    await downloadZip({ images, projectId, BUCKET, supabase, setStatus });
  }, [images, BUCKET, supabase, setStatus]);

  const renameFilesAction = useCallback(async ({ projectId, fetchImagesAfter }) => {
    await renameFiles({
      images, projectId, BUCKET, supabase, setStatus,
      fetchImages: fetchImagesAfter || fetchImages,
    });
  }, [images, BUCKET, supabase, setStatus, fetchImages]);

  const findDuplicatesAction = useCallback(async ({ projectId, fetchImagesAfter }) => {
    await findDuplicates({
      images, projectId, BUCKET, supabase, setStatus,
      fetchImages: fetchImagesAfter || fetchImages,
    });
  }, [images, BUCKET, supabase, setStatus, fetchImages]);

  // -------- helpers
  const clearImages = useCallback(() => setImages([]), []);
  const dragOver = useMemo(() => handleDragOver, [handleDragOver]);

  return {
    // state
    images, setImages,
    pendingCaptions, setPendingCaptions,
    lastFocusedImageId, setLastFocusedImageId,
    previewUrl, setPreviewUrl,

    // actions
    fetchImages,
    handleFileInputChange,
    handleDrop,
    handleDragOver: dragOver,
    deleteImage,
    captionChange,
    addPrefix,
    searchReplace,

    // wrappers
    downloadZipAction,
    renameFilesAction,
    findDuplicatesAction,

    // misc
    clearImages,
  };
}
