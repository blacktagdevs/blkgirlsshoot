const FLODESK_API = 'https://api.flodesk.com/v1';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = buildCors(origin, env.ALLOWED_ORIGIN);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return reply({ error: 'Method not allowed' }, 405, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return reply({ error: 'Invalid JSON' }, 400, corsHeaders);
    }

    const email = String(body.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply({ error: 'Valid email required' }, 400, corsHeaders);
    }

    const name = String(body.name || '').trim();
    const [first_name, ...rest] = name.split(/\s+/);
    const last_name = rest.join(' ');

    const custom_fields = {};
    if (body.phone) custom_fields.phone = String(body.phone).slice(0, 32);
    if (body.pass) custom_fields.pass_interest = String(body.pass).slice(0, 64);
    if (body.message) custom_fields.message = String(body.message).slice(0, 2000);

    const payload = {
      email,
      first_name: first_name || undefined,
      last_name: last_name || undefined,
      segment_ids: [env.FLODESK_SEGMENT_ID],
      ...(Object.keys(custom_fields).length ? { custom_fields } : {}),
    };

    const key = (env.FLODESK_API_KEY || '').trim();
    const auth = 'Basic ' + btoa(key + ':');

    const fd = await fetch(`${FLODESK_API}/subscribers`, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!fd.ok) {
      const text = await fd.text();
      console.error('Flodesk error', fd.status, text);
      return reply({ error: 'Subscribe failed' }, 502, corsHeaders);
    }

    return reply({ ok: true }, 200, corsHeaders);
  },
};

function reply(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function buildCors(origin, allowed) {
  const ok = !allowed || allowed === '*' || origin === allowed;
  return {
    'Access-Control-Allow-Origin': ok ? origin || '*' : allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}
