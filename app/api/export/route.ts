import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pastes } = await supabase
    .from('pastes')
    .select('slug, title, content, language, visibility, created_at, views')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
    total_pastes: pastes?.length || 0,
    pastes: pastes || [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="codepaste-export.json"',
    },
  });
}
