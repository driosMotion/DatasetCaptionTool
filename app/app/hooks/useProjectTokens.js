'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function useProjectTokens({ projectId, userId, setStatus }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTokens = useCallback(async () => {
    if (!projectId || !userId) { setTokens([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('project_tokens')
      .select('value')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('value', { ascending: true });
    setLoading(false);
    if (error) {
      console.error(error);
      setStatus?.('Error loading tokens');
      return;
    }
    setTokens((data || []).map(r => r.value));
  }, [projectId, userId, setStatus]);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  // util: split by comma/semicolon/newline, trim, unique
  const parseNewTokens = (input) => {
    return [...new Set(String(input)
      .split(/[,\n;]+/g)
      .map(s => s.trim())
      .filter(Boolean)
    )];
  };

  const addTokens = useCallback(async (input) => {
    if (!projectId || !userId) return;
    const candidates = Array.isArray(input) ? input : parseNewTokens(input);
    const toAdd = candidates.filter(v => !tokens.includes(v));
    if (toAdd.length === 0) return;

    // optimistic UI
    setTokens(prev => [...prev, ...toAdd].sort((a,b)=>a.localeCompare(b)));

    // upsert to avoid duplicates under unique(project_id, value)
    const rows = toAdd.map(v => ({ project_id: projectId, user_id: userId, value: v }));
    const { error } = await supabase
      .from('project_tokens')
      .upsert(rows, { onConflict: 'project_id,value' });
    if (error) {
      console.error(error);
      setStatus?.('Error saving tokens');
      // optional: refetch as truth source
      fetchTokens();
    } else {
      setStatus?.(`Added ${toAdd.length} token(s)`);
    }
  }, [projectId, userId, tokens, fetchTokens, setStatus]);

  const addToken = (v) => addTokens([v]); // single helper

  const deleteToken = useCallback(async (v) => {
    if (!projectId || !userId) return;
    // optimistic UI
    setTokens(prev => prev.filter(x => x !== v));
    const { error } = await supabase
      .from('project_tokens')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('value', v);
    if (error) {
      console.error(error);
      setStatus?.('Error deleting token');
      fetchTokens();
    }
  }, [projectId, userId, fetchTokens, setStatus]);

  return { tokens, loading, fetchTokens, addToken, addTokens, deleteToken };
}
