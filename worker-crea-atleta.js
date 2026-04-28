// Cloudflare Worker – Crea Atleta
// Variabile d'ambiente richiesta: SERVICE_ROLE (la service_role key di Supabase)

const SUPABASE_URL   = 'https://mvxwwpqbgthlzwympokg.supabase.co';
const ALLOWED_ORIGIN = 'https://winter-sc-subiaco.pages.dev';
const DOMINIO        = '@wintersc.app';

export default {
  async fetch(request, env) {

    const cors = {
      'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST')    return json({ error: 'Metodo non consentito' }, 405);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Richiesta non valida' }, 400); }

    const { nome, cognome, username, password } = body;
    if (!username || !password) return json({ error: 'Username e password obbligatori' }, 400);

    const email = username.toLowerCase().trim() + DOMINIO;

    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SERVICE_ROLE}`,
        'apikey':         env.SERVICE_ROLE,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nome:    nome    || '',
          cognome: cognome || '',
          ruolo:   'atleta',
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) return json({ error: data.message || data.msg || 'Errore nella creazione' }, 400);

    return json({ success: true, id: data.id });
  },
};
