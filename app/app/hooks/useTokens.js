'use client';

import { useEffect, useState } from 'react';

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

/**
 * Manages user tokens (sidebar), persisted to localStorage.
 * Returns { tokens, addToken, deleteToken, setTokens }.
 */
export default function useTokens(storageKey = 'ct_tokens') {
  const [tokens, setTokens] = useState([]);

  // load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setTokens(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [storageKey]);

  // persist on change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tokens));
    } catch {
      // ignore
    }
  }, [tokens, storageKey]);

  const addToken = (...values) => {
    const flat = values
      .flat()
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean);
    if (flat.length === 0) return;
    setTokens((prev) => uniq([...(prev || []), ...flat]));
  };

  const deleteToken = (value) => {
    setTokens((prev) => (prev || []).filter((t) => t !== value));
  };

  return { tokens, addToken, deleteToken, setTokens };
}
