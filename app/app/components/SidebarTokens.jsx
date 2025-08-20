'use client';
import React from 'react';

export default function SidebarTokens({
  tokens,
  tokenInputRef,
  onAddTokenClick,   // () => void (reads & clears tokenInputRef.current.value)
  onUseToken,        // (token: string) => void
  onDeleteToken,     // (token: string) => void
}) {
  return (
    <aside className="sidebar">
      <h3>🧠 My Tokens</h3>

      <div className="token-input-container">
        <input
          ref={tokenInputRef}
          type="text"
          id="newTokenInput"
          placeholder="Add token..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') onAddTokenClick();
          }}
        />
        <button id="addTokenBtn" onClick={onAddTokenClick}>➕</button>
      </div>

      <div id="myTokens" className="tokens">
        {tokens.map((t) => (
          <div
            key={t}
            className="token-btn"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <button
              onClick={() => onUseToken(t)}
              style={{ background: 'transparent', border: 0, color: '#eee', cursor: 'pointer' }}
              title="Insert this token into the focused caption"
            >
              {t}
            </button>
            <span
              className="delete-token"
              onClick={() => onDeleteToken(t)}
              style={{ cursor: 'pointer' }}
              title="Remove token"
            >
              ✖
            </span>
          </div>
        ))}
        {tokens.length === 0 && (
          <div style={{ color: '#888', fontSize: 12 }}>No tokens yet. Add one ↑</div>
        )}
      </div>
    </aside>
  );
}
