import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUser, hashToken } from '@/lib/auth';
import { randomBytes } from 'node:crypto';

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: tokens } = await supabase
    .from('api_tokens')
    .select('id, name, prefix, created_at, last_used_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ tokens });
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await request.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const rawToken = `cp_${randomBytes(24).toString('hex')}`;
  const hash = hashToken(rawToken);
  const prefix = rawToken.slice(0, 12) + '...';

  const { data, error } = await supabase
    .from('api_tokens')
    .insert({ user_id: user.id, name: name.trim(), token_hash: hash, prefix })
    .select('id, name, prefix, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ token: { ...data, raw_token: rawToken } }, { status: 201 });
}
