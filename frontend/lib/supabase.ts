import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy frontend/.env.local.example to frontend/.env.local and fill in your credentials.'
    );
  }
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// ---------- Types ----------

export interface Patient {
  id: string;
  external_id: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  session_id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  status: 'pending' | 'processing' | 'ingested' | 'failed';
  pages_ingested: number;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  session_id: string;
  audio_path: string;
  summary: string;
  segments: { timestamp: string; speaker: string; text: string }[];
  created_at: string;
}

// ---------- Mutations ----------

export async function createUser(externalId: string): Promise<Patient> {
  const sb = getSupabase();
  // Check if user already exists
  const { data: existing, error: checkError } = await sb
    .from('users')
    .select('*')
    .eq('external_id', externalId)
    .limit(1);
  if (checkError) throw new Error(checkError.message);
  if (existing && existing.length > 0) {
    throw new Error(`A patient with ID "${externalId}" already exists.`);
  }
  const { data, error } = await sb
    .from('users')
    .insert({ external_id: externalId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Patient;
}

// ---------- Queries ----------

export async function fetchUsers() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Patient[];
}

export async function fetchUser(userId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data as Patient;
}

export async function fetchSessions(userId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Session[];
}

export async function fetchDocuments(sessionId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('documents')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Document[];
}

export async function fetchDocumentsForUser(userId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Document[];
}

export async function fetchNotes(sessionId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('notes')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Note[];
}

export async function fetchNotesForUser(userId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Note[];
}
