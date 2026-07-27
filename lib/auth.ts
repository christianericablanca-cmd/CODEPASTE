import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { supabase } from './supabase';
import { createHash } from 'node:crypto';
import type { User } from '@supabase/supabase-js';

export async function getUser(request: NextRequest): Promise<User | null> {
  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string }[]) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
        },
      },
    }
  );
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (user) return user;

  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const jwtClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const { data: { user: jwtUser } } = await jwtClient.auth.getUser(token);
    if (jwtUser) return jwtUser;

    const hash = createHash('sha256').update(token).digest('hex');
    const { data: tokenData } = await supabase
      .from('api_tokens')
      .select('user_id')
      .eq('token_hash', hash)
      .maybeSingle();

    if (tokenData) {
      await supabase.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('token_hash', hash);
      const { data: userData } = await supabase.auth.admin.getUserById(tokenData.user_id);
      return userData?.user || null;
    }
  }

  return null;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
