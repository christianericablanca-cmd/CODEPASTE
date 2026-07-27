import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const baseFetch = typeof globalThis.fetch === 'function' ? fetch.bind(globalThis) : undefined;
const noCacheFetch: typeof fetch = (url, init) => {
  return (baseFetch || fetch)(url, { ...init, cache: 'no-store', next: { revalidate: 0 } as any });
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: noCacheFetch },
});
