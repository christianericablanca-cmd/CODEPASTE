import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: paste } = await supabase
    .from('pastes')
    .select('id, user_id')
    .eq('slug', params.slug)
    .single();

  if (!paste) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (paste.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: versions } = await supabase
    .from('paste_versions')
    .select('id, title, language, saved_at')
    .eq('paste_id', paste.id)
    .order('saved_at', { ascending: false });

  return NextResponse.json({ versions });
}
