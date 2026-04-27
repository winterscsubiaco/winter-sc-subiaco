// ============================================================
// CONFIGURAZIONE SUPABASE
// Sostituisci i valori qui sotto con quelli del tuo progetto
// Li trovi su: supabase.com → tuo progetto → Settings → API
// ============================================================

const SUPABASE_URL = 'https://mvxwwpqbgthlzwympokg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VB_J-UOJq9uJR_9OBeHXAQ_CTqoPQqj';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
