'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * Handles Supabase auth, redirects to "/" if not signed in,
 * and exposes { email, ready } to the page.
 */
export default function useAuthGate() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // live session changes
    const sub = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) {
        router.push('/');
        return;
      }
      setEmail(session.user.email || '');
      setReady(true);
    });

    // initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/');
        return;
      }
      setEmail(session.user.email || '');
      setReady(true);
    });

    return () => sub.data?.subscription?.unsubscribe?.();
  }, [router]);

  return { email, ready };
}
