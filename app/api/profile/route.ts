import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';

async function getUser(request: NextRequest) {
  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  );
  const { data } = await supabaseClient.auth.getUser();
  return data.user;
}

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const nickname = user.user_metadata?.full_name || user.email?.split('@')[0] || 'dev';
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({ id: user.id, nickname, preferences: {} })
      .select()
      .single();
    profile = newProfile;
  }

  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.nickname !== undefined) updateData.nickname = body.nickname;
  if (body.preferences !== undefined) updateData.preferences = body.preferences;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error: pastesError } = await supabase
    .from('pastes')
    .delete()
    .eq('user_id', user.id);

  if (pastesError) return NextResponse.json({ error: pastesError.message }, { status: 500 });

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
