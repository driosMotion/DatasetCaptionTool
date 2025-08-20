// app/page.js
'use client';

import { supabase } from '@/lib/supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Redirect to /app if already signed in
    const { data: subscription } = supabase.auth.onAuthStateChange((_evt, session) => {
      const e = session?.user?.email ?? '';
      setEmail(e);
      if (session) router.push('/app');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const e = session?.user?.email ?? '';
      setEmail(e);
      if (session) router.push('/app');
    });

    return () => {
      subscription?.subscription?.unsubscribe?.();
    };
  }, [router]);

  return (
    <div style={{ maxWidth: 440, margin: '40px auto' }}>
      <h1 style={{ marginBottom: 8 }}>Sign in</h1>
      <p style={{ color: '#aaa', marginBottom: 16 }}>
        {email ? `Signed in as ${email}` : 'Use email/password or magic link.'}
      </p>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}         // add 'google' later if you want
        view="sign_in"
        showLinks
      />
    </div>
  );
}
