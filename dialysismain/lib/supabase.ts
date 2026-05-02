import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gmrrsfsolhzpxasjvsfh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcnJzZnNvbGh6cHhhc2p2c2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzM1ODYsImV4cCI6MjA5MzI0OTU4Nn0.eMNCPhl4yOXOAya3DwI9rFTzEoaldSbUnDG1tBz3CJA';

// During build time on Vercel, these might be missing.
// We only initialize if they are present to avoid crashing the build.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

if (!supabase) {
  console.warn('Supabase credentials are missing. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables.');
}
