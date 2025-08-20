'use client';
import React, { useState } from 'react';

export default function ImageCard({
  img,
  selected = false,
  onToggleSelect,        // (id, checked) => void
  onOpenPreview,         // (url) => void
  onKeepSelectedToken,   // () => void
  onDelete,              // (img) => void
  onCaptionChange,       // (id, text) => void
  onCaptionFocus,        // (id) => void
  registerCaptionRef,    // (id, el) => void

  // DnD handlers
  onDragStartCard,       // (id) => void
  onDragOverCard,        // (id, e) => void
  onDropOnCard,          // (id) => void
  onDragEndCard,         // () => void
}) {
  const [isDragging, setIsDragging] = useState(false);

  const fileName =
    img.original_name || (img.s3_key ? img.s3_key.split('/').pop() : 'image');

  return (
    <div
      className={`card${isDragging ? ' dragging' : ''}`}
      draggable
      onDragStart={() => { setIsDragging(true); onDragStartCard?.(img.id); }}
      onDragOver={(e) => { e.preventDefault(); onDragOverCard?.(img.id, e); }}
      onDrop={() => { onDropOnCard?.(img.id); setIsDragging(false); }}
      onDragEnd={() => { onDragEndCard?.(); setIsDragging(false); }}
    >
      {/* Name + select checkbox */}
      <div className="filename-row" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginBottom: 8 }}>
        <span className="filename" style={{ flex: 1, textAlign: 'center', margin: 0 }}>
          {fileName}
        </span>
        <input
          type="checkbox"
          className="select-checkbox"
          style={{ alignSelf: 'center', margin: 0 }}
          checked={!!selected}
          onChange={(e) => onToggleSelect?.(img.id, e.target.checked)}
          title="Select this card"
        />
      </div>

      {/* Image */}
      <div className="image-container" onClick={() => onOpenPreview?.(img.url)} style={{ cursor: 'zoom-in' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.url} alt={fileName} />
      </div>

      {/* Card action buttons */}
      <div className="card-controls">
        <button className="keep-btn" onClick={onKeepSelectedToken}>Keep Token</button>
        <button className="delete-btn" onClick={() => onDelete?.(img)}>Delete</button>
      </div>

      {/* Caption */}
      <textarea
        ref={(el) => registerCaptionRef?.(img.id, el)}
        className="caption"
        placeholder="Write caption…"
        value={img.caption || ''}
        onChange={(e) => onCaptionChange?.(img.id, e.target.value)}
        onFocus={() => onCaptionFocus?.(img.id)}
      />
    </div>
  );
}
