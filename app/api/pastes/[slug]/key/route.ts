import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { serverDecryptKey } from '@/lib/server-crypto';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: paste } = await supabase
    .from('pastes')
    .select('user_id, owner_key_enc')
    .eq('slug', params.slug)
    .single();

  if (!paste) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (paste.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!paste.owner_key_enc) return NextResponse.json({ error: 'No stored key' }, { status: 404 });

  try {
    const key = serverDecryptKey(paste.owner_key_enc);
    return NextResponse.json({ key });
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt key' }, { status: 500 });
  }
}
