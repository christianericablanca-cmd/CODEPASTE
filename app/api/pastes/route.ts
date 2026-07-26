import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/auth';
import { generateSlug } from '@/lib/slug';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get('count') === 'true') {
    const { count, error } = await supabase
      .from('pastes')
      .select('*', { count: 'exact', head: true })
      .eq('visibility', 'public');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ count });
  }

  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  const user = await getUser(request);
  let query = supabase
    .from('pastes')
    .select('slug, title, language, visibility, created_at, views, user_id')
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (user) {
    query = query.or(`visibility.eq.public,user_id.eq.${user.id}`);
  } else {
    query = query.eq('visibility', 'public');
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pastes: data, limit, offset });
}

export async function POST(request: NextRequest) {
  try {
    const { content, language, title, visibility, expiresIn, password_protected, wrapped_key, wrapped_key_salt, wrapped_key_iv } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 1_000_000) {
      return NextResponse.json({ error: 'Content too large (max 1MB)' }, { status: 400 });
    }

    const user = await getUser(request);

    let slug = generateSlug(6);
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase
        .from('pastes')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle();
      if (!existing) break;
      slug = generateSlug(7);
    }

    let expiresAt = null;
    if (expiresIn) {
      const now = new Date();
      switch (expiresIn) {
        case '10min': expiresAt = new Date(now.getTime() + 10 * 60000); break;
        case '1hour': expiresAt = new Date(now.getTime() + 3600000); break;
        case '1day': expiresAt = new Date(now.getTime() + 86400000); break;
        case '1week': expiresAt = new Date(now.getTime() + 604800000); break;
        case '1month': expiresAt = new Date(now.getTime() + 2592000000); break;
      }
    }

    const insertData: Record<string, unknown> = {
      slug,
      title: title || 'untitled',
      content,
      language: language || 'plaintext',
      visibility: visibility || 'public',
      expires_at: expiresAt,
    };
    if (user) insertData.user_id = user.id;
    if (password_protected) {
      insertData.password_protected = true;
      insertData.wrapped_key = wrapped_key;
      insertData.wrapped_key_salt = wrapped_key_salt;
      insertData.wrapped_key_iv = wrapped_key_iv;
    }

    const { data, error } = await supabase
      .from('pastes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create paste' }, { status: 500 });
    }

    return NextResponse.json({
      slug: data.slug,
      url: `${request.nextUrl.origin}/p/${data.slug}`,
    }, { status: 201 });
  } catch (err) {
    console.error('Create paste error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
