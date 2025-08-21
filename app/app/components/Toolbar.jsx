'use client';
import React from 'react';

export default function Toolbar({
  fileInputRef,
  onFileInputChange,
  onDownloadZip,
  onRenameFiles,
  onFindDuplicates,
  onAddPrefix,
  onSearchReplace,
}) {
  return (
    <div className="ui-bar toolbar">
      {/* hidden input that the dropzone triggers */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.txt"
        style={{ position:'absolute', left:'-9999px', width:0, height:0, opacity:0 }}
        onChange={onFileInputChange}
      />

      <button className="ui-btn" id="downloadZipBtn" onClick={onDownloadZip}>⬇️ Download ZIP</button>
      <button className="ui-btn" id="renameFilesBtn" onClick={onRenameFiles}>✏️ Rename</button>
      <button className="ui-btn" id="deleteDuplicatesBtn" onClick={onFindDuplicates}>🧹 Duplicates</button>
      <button className="ui-btn" id="addPrefixBtn" onClick={onAddPrefix}>🔑 Add Prefix</button>
      <button className="ui-btn" id="searchReplaceBtn" onClick={onSearchReplace}>🔁 Replace</button>
    </div>
  );
}
