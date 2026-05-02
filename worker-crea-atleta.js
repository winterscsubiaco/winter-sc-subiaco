// Cloudflare Worker – Crea / Elimina Atleta
// Variabile d'ambiente richiesta: SERVICE_ROLE (la service_role key di Supabase)

const SUPABASE_URL   = 'https://mvxwwpqbgthlzwympokg.supabase.co';
const ALLOWED_ORIGIN = 'https://winter-sc-subiaco.pages.dev';
const DOMINIO        = '@wintersc.app';

export default {
  async fetch(request, env) {

    const cors = {
      'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const sbHeaders = {
      'Authorization': `Bearer ${env.SERVICE_ROLE}`,
      'apikey':         env.SERVICE_ROLE,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal',
    };

    // ── ELIMINA ATLETA ──────────────────────────────────────
    if (request.method === 'DELETE') {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Richiesta non valida' }, 400); }

      const { atletaId } = body;
      if (!atletaId) return json({ error: 'atletaId obbligatorio' }, 400);

      // 1. letture_avvisi
      await fetch(`${SUPABASE_URL}/rest/v1/letture_avvisi?atleta_id=eq.${atletaId}`,
        { method: 'DELETE', headers: sbHeaders });

      // 2. allenamenti (via diari)
      const diarRes = await fetch(
        `${SUPABASE_URL}/rest/v1/diari?atleta_id=eq.${atletaId}&select=id`,
        { headers: { ...sbHeaders, 'Prefer': 'return=representation' } }
      );
      const diari = await diarRes.json();
      if (Array.isArray(diari) && diari.length > 0) {
        const ids = diari.map(d => d.id).join(',');
        await fetch(`${SUPABASE_URL}/rest/v1/allenamenti?diario_id=in.(${ids})`,
          { method: 'DELETE', headers: sbHeaders });
      }

      // 3. diari
      await fetch(`${SUPABASE_URL}/rest/v1/diari?atleta_id=eq.${atletaId}`,
        { method: 'DELETE', headers: sbHeaders });

      // 4. profiles
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${atletaId}`,
        { method: 'DELETE', headers: sbHeaders });

      // 5. auth user
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${atletaId}`,
        { method: 'DELETE', headers: sbHeaders });

      if (!authRes.ok) {
        const authData = await authRes.json().catch(() => ({}));
        return json({ error: authData.message || 'Errore eliminazione utente' }, 400);
      }

      return json({ success: true });
    }

    // ── CREA ATLETA ─────────────────────────────────────────
    if (request.method !== 'POST') return json({ error: 'Metodo non consentito' }, 405);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Richiesta non valida' }, 400); }

    const { nome, cognome, username, password, ruolo } = body;
    if (!username || !password) return json({ error: 'Username e password obbligatori' }, 400);

    const ruoloValido = ruolo === 'allenatrice' ? 'allenatrice' : 'atleta';
    const email = username.toLowerCase().trim() + DOMINIO;

    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Prefer': '' },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome: nome || '', cognome: cognome || '', ruolo: ruoloValido },
      }),
    });

    const data = await res.json();
    if (!res.ok) return json({ error: data.message || data.msg || 'Errore nella creazione' }, 400);

    return json({ success: true, id: data.id });
  },
};
