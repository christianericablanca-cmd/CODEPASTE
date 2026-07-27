import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

import { createClient } from '@/lib/supabase-server';
import { serverEncryptKey } from '@/lib/server-crypto';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { data: paste } = await supabase
    .from('pastes')
    .select('slug, title, content, language, visibility, password_protected')
    .eq('slug', params.slug)
    .single();
  if (!paste) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ paste });
}

export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { data: existing } = await supabase
    .from('pastes')
    .select('id, user_id, title, content, language')
    .eq('slug', params.slug)
    .single();

  if (!existing) { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
  if (existing.user_id !== user.id) { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  if (body.language !== undefined) updates.language = body.language;
  if (body.visibility !== undefined) updates.visibility = body.visibility;

  if (body.content !== undefined && body.content !== existing.content) {
    await supabase.from('paste_versions').insert({
      paste_id: existing.id,
      title: existing.title,
      content: existing.content,
      language: existing.language,
    });
  }

  if (body.owner_key) {
    updates.owner_key_enc = serverEncryptKey(body.owner_key);
  }

  const { data, error } = await supabase
    .from('pastes')
    .update(updates)
    .eq('slug', params.slug)
    .select()
    .single();

  if (error) { return NextResponse.json({ error: error.message }, { status: 500 }); }
  return NextResponse.json({ paste: data });
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: paste } = await supabase
    .from('pastes')
    .select('user_id')
    .eq('slug', params.slug)
    .single();

  if (!paste) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (paste.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('pastes').delete().eq('slug', params.slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
