'use client';
import React from 'react';

export default function PreviewModal({ url, onClose }) {
  return (
    <div
      id="previewModal"
      className={`modal ${url ? '' : 'hidden'}`}
      onClick={onClose}
    >
      <span id="closeBtn" className="close-btn" onClick={onClose}>✖</span>
      {url ? <img id="previewImage" src={url} alt="Preview" /> : null}
    </div>
  );
}
