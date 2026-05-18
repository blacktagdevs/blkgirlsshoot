const KLAVIYO_API = 'https://a.klaviyo.com/api';
const KLAVIYO_REVISION = '2026-04-15';

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

    const phone_number = normalizePhone(body.phone);
    const properties = { source: 'blkgirlsshoot.net' };
    if (body.phone && !phone_number) properties.phone_raw = String(body.phone).slice(0, 32);
    if (body.message) properties.message = String(body.message).slice(0, 2000);

    const key = (env.KLAVIYO_API_KEY || '').trim();
    const baseHeaders = {
      Authorization: `Klaviyo-API-Key ${key}`,
      'Content-Type': 'application/json',
      accept: 'application/json',
      revision: KLAVIYO_REVISION,
    };

    // 1) Upsert profile with custom data. 409 = already exists, treat as success.
    const profileBody = {
      data: {
        type: 'profile',
        attributes: {
          email,
          ...(first_name ? { first_name } : {}),
          ...(last_name ? { last_name } : {}),
          ...(phone_number ? { phone_number } : {}),
          properties,
        },
      },
    };

    const profileRes = await fetch(`${KLAVIYO_API}/profiles/`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify(profileBody),
    });

    if (!profileRes.ok && profileRes.status !== 409) {
      const text = await profileRes.text();
      console.error('Klaviyo profile error', profileRes.status, text);
      return reply({ error: 'Subscribe failed' }, 502, corsHeaders);
    }

    // 2) Subscribe to the list (idempotent — re-subscribing existing profile is fine).
    const subBody = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email,
                  subscriptions: {
                    email: {
                      marketing: { consent: 'SUBSCRIBED' },
                    },
                  },
                },
              },
            ],
          },
        },
        relationships: {
          list: {
            data: { type: 'list', id: env.KLAVIYO_LIST_ID },
          },
        },
      },
    };

    const subRes = await fetch(`${KLAVIYO_API}/profile-subscription-bulk-create-jobs`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify(subBody),
    });

    if (!subRes.ok) {
      const text = await subRes.text();
      console.error('Klaviyo subscribe error', subRes.status, text);
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

// Best-effort E.164 normalizer, US-default. Returns null if the input
// doesn't look like a phone number Klaviyo will accept.
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (digits.length >= 11 && digits.length <= 15) return '+' + digits;
  return null;
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
