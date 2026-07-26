import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ pastes: [] });
  }

  const { data, error } = await supabase
    .from('pastes')
    .select('slug, title, language, created_at, views')
    .eq('visibility', 'public')
    .textSearch('search_vector', q, { type: 'websearch' })
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pastes: data });
}
