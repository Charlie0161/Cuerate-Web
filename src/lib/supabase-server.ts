import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iaqprkjgphbzmgttpohy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcXBya2pncGhiem1ndHRwb2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODMyMzcsImV4cCI6MjA5NjY1OTIzN30.LRmtJ6KVKtZruYlDn0Psn9XzKZE7w5Gcmn1IMxOKeLU';

export function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
