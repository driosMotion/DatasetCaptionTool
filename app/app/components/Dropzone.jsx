'use client';
import React from 'react';

export default function Dropzone({
  onChooseFiles,  // () => void
  onDragOver,     // (e) => void
  onDrop,         // (e) => void
}) {
  return (
    <div
      id="dropzone"
      className="dropzone"
      role="button"
      tabIndex={0}
      onClick={onChooseFiles}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChooseFiles()}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span>📂 Drag your files here or click</span>
    </div>
  );
}
