// ============================================================
// CONFIGURAZIONE SUPABASE
// Sostituisci i valori qui sotto con quelli del tuo progetto
// Li trovi su: supabase.com → tuo progetto → Settings → API
// ============================================================

const SUPABASE_URL = 'https://mvxwwpqbgthlzwympokg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12eHd3cHFiZ3RobHp3eW1wb2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTY0NTksImV4cCI6MjA5Mjg5MjQ1OX0.yibZM9kfdYuMWIUS2HqgZQV5uzvZulUbTYRI2fVgk4I';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
