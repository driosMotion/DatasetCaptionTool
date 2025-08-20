'use client';
import React from 'react';

export default function Toolbar({
  fileInputRef,
  onFileInputChange,   // (e) => void
  onDownloadZip,       // () => void
  onRenameFiles,       // () => void
  onFindDuplicates,    // () => void
  onAddPrefix,         // () => void
  onSearchReplace,     // () => void
}) {
  return (
    <div className="toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {/* hidden input that the dropzone triggers */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.txt"
        style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, opacity: 0 }}
        onChange={onFileInputChange}
      />
      <button id="downloadZipBtn" onClick={onDownloadZip}>⬇️ Download ZIP</button>
      <button id="renameFilesBtn" onClick={onRenameFiles}>✏️ Rename</button>
      <button id="deleteDuplicatesBtn" onClick={onFindDuplicates}>🧹 Duplicates</button>
      <button id="addPrefixBtn" onClick={onAddPrefix}>🔑 Add Prefix</button>
      <button id="searchReplaceBtn" onClick={onSearchReplace}>🔁 Replace</button>
    </div>
  );
}
