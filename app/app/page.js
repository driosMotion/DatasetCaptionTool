// app/app/page.js
'use client';

import { useRef, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

import useAuthGate from '@/app/app/hooks/useAuthGate';
import useTokens from '@/app/app/hooks/useTokens';
import useProjects from '@/app/app/hooks/useProjects';
import useImages from '@/app/app/hooks/useImages';

import ImageCard from '@/app/app/components/ImageCard';
import SidebarTokens from '@/app/app/components/SidebarTokens';
import ProjectsBar from '@/app/app/components/ProjectsBar';
import Toolbar from '@/app/app/components/Toolbar';
import Dropzone from '@/app/app/components/Dropzone';
import PreviewModal from '@/app/app/components/PreviewModal';

export default function AppPage() {
  // --- Auth & Status
  const { email, ready } = useAuthGate();
  const [status, setStatus] = useState('');

  // --- Tokens
  const { tokens, addToken, deleteToken } = useTokens('ct_tokens');

  // --- Constants
  const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;

  // --- Projects
  const {
    projects,
    projectId, setProjectId,
    newProjectName, setNewProjectName,
    fetchProjects,
    createProject,
    deleteProject,
  } = useProjects({ supabase, BUCKET, setStatus, ready });

  // --- Images (NOTE: hook is called once; we destructure its fields)
  const {
    images, setImages,
    lastFocusedImageId, setLastFocusedImageId,
    previewUrl, setPreviewUrl,
    fetchImages,
    handleFileInputChange,
    handleDrop,
    handleDragOver,
    deleteImage,
    captionChange,
    addPrefix,
    searchReplace,
    downloadZipAction,
    renameFilesAction,
    findDuplicatesAction,
    clearImages,
  } = useImages({ supabase, BUCKET, setStatus });

  // --- Refs (for token insertion & file picker)
  const fileInputRef = useRef(null);
  const captionRefs = useRef({});
  const tokenInputRef = useRef(null);

  // --- Selection state (IDs of selected images)
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // --- Drag state for reordering
  const [dragId, setDragId] = useState(null);

  // prune selection when images list changes
  useEffect(() => {
    const ids = new Set(images.map((i) => i.id));
    setSelectedIds((prev) => new Set([...prev].filter((id) => ids.has(id))));
  }, [images]);

  const toggleSelect = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // open hidden input
  const handleChooseFiles = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  // Helper to move an item in array by ids
  const moveById = (list, fromId, toId) => {
    if (fromId === toId) return list;
    const fromIdx = list.findIndex((x) => x.id === fromId);
    const toIdx = list.findIndex((x) => x.id === toId);
    if (fromIdx === -1 || toIdx === -1) return list;
    const next = list.slice();
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    return next;
  };

  // --- DnD Handlers (reorder in UI on hover, persist on drop if possible)
  const onDragStartCard = (id) => setDragId(id);

  const onDragOverCard = (overId, e) => {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    setImages((prev) => moveById(prev, dragId, overId));
  };

  const onDropOnCard = async (overId) => {
    if (!dragId) return;
    setImages((prev) => moveById(prev, dragId, overId));
    setDragId(null);

    // Try to persist order if DB has a sort_index column
    try {
      const updates = (prev => prev)(images).map((img, idx) => ({ id: img.id, sort_index: idx }));
      for (const u of updates) {
        const { error } = await supabase.from('images').update({ sort_index: u.sort_index }).eq('id', u.id);
        if (error && /column|sort_index/i.test(error.message || '')) {
          setStatus('Reordered (not persisted — add numeric "sort_index" to images table).');
          return;
        }
      }
      setStatus('Order saved');
    } catch {
      setStatus('Reordered (local only)');
    }
  };

  const onDragEndCard = () => setDragId(null);

  // Helper to insert a token into a caption string at [start,end] with spacing rules
  const insertToken = (value, token, start, end) => {
    const safeValue = value ?? '';
    const s = Math.max(0, Math.min(start ?? safeValue.length, safeValue.length));
    const e = Math.max(s, Math.min(end ?? safeValue.length, safeValue.length));
    const needsSpaceBefore = s > 0 && !/\s$/.test(safeValue.slice(0, s));
    const needsSpaceAfter = e < safeValue.length && !/^\s/.test(safeValue.slice(e));
    const before = safeValue.slice(0, s);
    const after = safeValue.slice(e);
    const insert = `${needsSpaceBefore ? ' ' : ''}${token}${needsSpaceAfter ? ' ' : ''}`;
    return { text: before + insert + after, caret: (before + insert).length };
  };

  // Apply token to selected captions (or focused one)
  const handleUseTrigger = (t) => {
    const token = String(t || '').trim();
    if (!token) { setStatus('Empty token'); return; }

    const selected = [...selectedIds];
    if (selected.length > 0) {
      let applied = 0;
      for (const id of selected) {
        const el = captionRefs.current[id];
        const img = images.find((i) => i.id === id);
        if (!img) continue;
        const start = (el && document.activeElement === el) ? el.selectionStart : (img.caption || '').length;
        const end = (el && document.activeElement === el) ? el.selectionEnd : (img.caption || '').length;
        const { text } = insertToken(img.caption || '', token, start, end);
        captionChange(id, text);
        applied++;
      }
      setStatus(`Token added to ${applied} caption(s)`);
      return;
    }

    if (!lastFocusedImageId) {
      setStatus('Select card(s) or click a caption first.');
      return;
    }
    const el = captionRefs.current[lastFocusedImageId];
    if (!el) { setStatus('Active caption not found'); return; }

    const { text, caret } = insertToken(el.value ?? '', token, el.selectionStart, el.selectionEnd);
    captionChange(lastFocusedImageId, text);
    requestAnimationFrame(() => {
      try { el.focus(); el.setSelectionRange(caret, caret); } catch { }
    });
    setStatus('Token added');
  };

  // selected text -> token
  const handleKeepSelectedAsToken = () => {
    const sel = window.getSelection?.();
    const text = sel ? sel.toString().trim() : '';
    if (!text) { setStatus('Select some text in a caption first'); return; }
    addToken(text);
    setStatus(`Token added: "${text}"`);
  };

  // caption ref registrar
  const registerCaptionRef = (id, el) => {
    if (el) captionRefs.current[id] = el;
    else delete captionRefs.current[id];
  };

  if (!ready) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div className="app-root">
      {/* Header (logo + title + Sign Out) */}
            <div className="header" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px' }}>
        <div className="logo">
          <img src="/aiaiai_logo.jpeg" alt="Aiaiai Logo" style={{ height: 50, width: 'auto', display: 'block' }} />
        </div>
        <div className="made-by" style={{ flex: 0, whiteSpace: 'nowrap' }}>
          Dataset Caption Tool - by Pat
        </div>

        {/* Right side: Signed in + Sign Out */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="signed-in" style={{ whiteSpace: 'nowrap', fontSize: 12, opacity: 0.85 }}>
            Signed in as {email}
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut({ scope: 'local' });
              Object.keys(localStorage).forEach((k) => {
                if (k.startsWith('sb-') || k.includes('supabase')) localStorage.removeItem(k);
              });
              window.location.assign('/');
            }}
            style={{ padding: '6px 10px' }}
          >
            Sign Out
          </button>
        </div>
      </div>


      {/* Projects + status */}
            <ProjectsBar
        email={email}
        status={status}
        projects={projects}
        projectId={projectId}
        newProjectName={newProjectName}
        onChangeProject={(v) => {
          setProjectId(v);
          if (v) fetchImages(v); else { clearImages(); setSelectedIds(new Set()); }
        }}
        onChangeNewProjectName={setNewProjectName}
        onCreateProject={createProject}
        onDeleteProject={() =>
          deleteProject({
            onDeleted: () => {
              clearImages();
              setPreviewUrl('');
              setSelectedIds(new Set());
            },
          })
        }
        onRefresh={fetchProjects}
      />


            {/* Toolbar BELOW the projects area */}
            <div className="toolbar-wrapper" >
              <Toolbar
        fileInputRef={fileInputRef}
        onFileInputChange={(e) => handleFileInputChange(e, projectId)}
        onDownloadZip={() => downloadZipAction({ projectId })}
        onRenameFiles={() =>
          renameFilesAction({ projectId, fetchImagesAfter: (pid) => fetchImages(pid || projectId) })
        }
        onFindDuplicates={() =>
          findDuplicatesAction({ projectId, fetchImagesAfter: (pid) => fetchImages(pid || projectId) })
        }
        onAddPrefix={() => addPrefix({ projectId, targetId: lastFocusedImageId })}
        onSearchReplace={() => searchReplace({ projectId })}
      />
      </div>

      {/* Main layout */}
      <div className="main">
        <div className="gallery-container">
          <Dropzone
            onChooseFiles={handleChooseFiles}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, projectId)}
          />

          <div id="gallery" className="gallery">
            {images.map((img) => (
              <ImageCard
                key={img.id}
                img={img}
                selected={selectedIds.has(img.id)}
                onToggleSelect={toggleSelect}
                onOpenPreview={(url) => setPreviewUrl(url || '')}
                onKeepSelectedToken={handleKeepSelectedAsToken}
                onDelete={deleteImage}
                onCaptionChange={captionChange}
                onCaptionFocus={setLastFocusedImageId}
                registerCaptionRef={registerCaptionRef}
                // DnD wiring
                onDragStartCard={onDragStartCard}
                onDragOverCard={onDragOverCard}
                onDropOnCard={onDropOnCard}
                onDragEndCard={onDragEndCard}
              />
            ))}
          </div>
        </div>

        <SidebarTokens
          tokens={tokens}
          tokenInputRef={tokenInputRef}
          onAddTokenClick={() => {
            const val = tokenInputRef.current?.value?.trim();
            if (!val) { setStatus('Type a token first'); return; }
            addToken(val);
            tokenInputRef.current.value = '';
          }}
          onUseToken={handleUseTrigger}
          onDeleteToken={(t) => deleteToken(t)}
        />
      </div>

      {/* Image Preview Modal */}
      <PreviewModal url={previewUrl} onClose={() => setPreviewUrl('')} />
    </div>
  );
}
