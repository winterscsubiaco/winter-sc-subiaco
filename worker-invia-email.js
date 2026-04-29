export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { titolo, testo, emails } = await request.json();

    if (!emails || emails.length === 0) {
      return new Response(JSON.stringify({ error: 'Nessun destinatario' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const corpo = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#0A2E6E;padding:16px 20px;border-radius:8px 8px 0 0;">
          <h2 style="color:#F9A825;margin:0;">Winter SC Subiaco</h2>
        </div>
        <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;border:1px solid #ddd;">
          <h3 style="color:#0A2E6E;margin-top:0;">${titolo}</h3>
          ${testo ? `<p style="color:#333;line-height:1.6;">${testo}</p>` : ''}
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="color:#999;font-size:12px;margin:0;">
            Accedi all'app per vedere tutti i dettagli:
            <a href="https://winter-sc-subiaco.pages.dev" style="color:#0A2E6E;">winter-sc-subiaco.pages.dev</a>
          </p>
        </div>
      </div>
    `;

    const destinatari = emails.map(e => ({ email: e }));

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Winter SC Subiaco', email: 'wintersc.subiaco@gmail.com' },
        to: destinatari,
        subject: `[Winter SC] ${titolo}`,
        htmlContent: corpo,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  },
};
