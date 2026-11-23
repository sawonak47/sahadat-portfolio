/**
 * Sahadat AI — Cloudflare Worker Backend Proxy (Free Tier)
 * --------------------------------------------------------
 * Features:
 * - Public visitors use Sahadat AI with ZERO API key exposed in the browser.
 * - Admin can update the OpenRouter API key (or model) directly from the website
 *   using the password-protected "Change AI" modal; updates persist globally via Cloudflare KV.
 *
 * Cloudflare Dashboard Setup (100% Free):
 * 1. KV Namespace binding name: SAHADAT_KV
 * 2. Encrypted Secret 1:        OPENROUTER_API_KEY  (your initial OpenRouter key)
 * 3. Encrypted Secret 2:        ADMIN_PASSWORD      (e.g. sawonak47)
 */

const ALLOWED_ORIGINS = [
  'https://sawonak47.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765'
];

const DEFAULT_PRIMARY_MODEL = 'nvidia/nemotron-3.5-super-vl:free';
const DEFAULT_FALLBACK_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
  });
}

function maskKey(key) {
  if (!key || key.length < 14) return key ? '••••••' : 'Not set';
  return `${key.slice(0, 12)}•••${key.slice(-4)}`;
}

async function getActiveApiKey(env) {
  if (env.SAHADAT_KV) {
    try {
      const kvKey = await env.SAHADAT_KV.get('active_api_key');
      if (kvKey && kvKey.trim()) return kvKey.trim();
    } catch {
      // Fallback to env secret
    }
  }
  return (env.OPENROUTER_API_KEY || '').trim();
}

async function getActiveModel(env) {
  if (env.SAHADAT_KV) {
    try {
      const kvModel = await env.SAHADAT_KV.get('active_model');
      if (kvModel && kvModel.trim()) return kvModel.trim();
    } catch {
      // Fallback to default
    }
  }
  return DEFAULT_PRIMARY_MODEL;
}

function checkAdminPassword(provided, env) {
  const expected = (env.ADMIN_PASSWORD || '').trim();
  if (!expected) return { ok: false, status: 503, error: 'ADMIN_PASSWORD secret is not configured in Cloudflare.' };
  const input = String(provided || '').trim();
  if (!input || input.length !== expected.length) {
    return { ok: false, status: 401, error: 'Incorrect password.' };
  }
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return { ok: false, status: 401, error: 'Incorrect password.' };
  return { ok: true };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ── HEALTH CHECK ──
    if (request.method === 'GET' && (path === '/' || path === '/health')) {
      const key = await getActiveApiKey(env);
      return jsonResponse({
        ok: true,
        engine: 'Sahadat AI',
        live: Boolean(key),
        kvEnabled: Boolean(env.SAHADAT_KV)
      }, 200, origin);
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, origin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, origin);
    }

    // ── ADMIN: VERIFY PASSWORD & GET MASKED STATUS ──
    if (path === '/admin/verify') {
      const auth = checkAdminPassword(payload.password, env);
      if (!auth.ok) return jsonResponse({ ok: false, error: auth.error }, auth.status, origin);

      const activeKey = await getActiveApiKey(env);
      const activeModel = await getActiveModel(env);
      const updatedAt = env.SAHADAT_KV ? await env.SAHADAT_KV.get('updated_at') : null;

      return jsonResponse({
        ok: true,
        maskedKey: maskKey(activeKey),
        hasKey: Boolean(activeKey),
        kvEnabled: Boolean(env.SAHADAT_KV),
        activeModel,
        updatedAt: updatedAt || 'Initial secret'
      }, 200, origin);
    }

    // ── ADMIN: UPDATE API KEY (AND OPTIONAL MODEL) IN CLOUDFLARE KV ──
    if (path === '/admin/update-key') {
      const auth = checkAdminPassword(payload.password, env);
      if (!auth.ok) return jsonResponse({ ok: false, error: auth.error }, auth.status, origin);

      if (!env.SAHADAT_KV) {
        return jsonResponse({
          ok: false,
          error: 'Cloudflare KV binding "SAHADAT_KV" is not attached to this Worker yet.'
        }, 500, origin);
      }

      const newKey = String(payload.apiKey || '').trim();
      const newModel = String(payload.model || '').trim();

      if (!newKey && !newModel) {
        return jsonResponse({ ok: false, error: 'Please enter a new API key or model.' }, 400, origin);
      }

      // Live-validate the new API key before replacing the old one
      if (newKey) {
        try {
          const checkRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
            headers: { 'Authorization': `Bearer ${newKey}` }
          });
          if (!checkRes.ok) {
            return jsonResponse({
              ok: false,
              error: 'That API key was rejected (invalid or revoked). Old key was kept safe.'
            }, 400, origin);
          }
        } catch {
          return jsonResponse({
            ok: false,
            error: 'Could not verify the new API key right now. Please try again.'
          }, 502, origin);
        }

        await env.SAHADAT_KV.put('active_api_key', newKey);
      }

      if (newModel) {
        await env.SAHADAT_KV.put('active_model', newModel);
      }

      const nowIso = new Date().toISOString();
      await env.SAHADAT_KV.put('updated_at', nowIso);

      const activeKey = await getActiveApiKey(env);
      const activeModel = await getActiveModel(env);

      return jsonResponse({
        ok: true,
        message: 'Sahadat AI updated globally for all visitors!',
        maskedKey: maskKey(activeKey),
        activeModel,
        updatedAt: nowIso
      }, 200, origin);
    }

    // ── PUBLIC: SAHADAT AI SEO GENERATION ──
    const apiKey = await getActiveApiKey(env);
    if (!apiKey) {
      return jsonResponse({ error: 'Sahadat AI server key is not configured.' }, 500, origin);
    }

    const activeModel = await getActiveModel(env);
    const modelsToTry = payload.model
      ? [payload.model]
      : activeModel === DEFAULT_FALLBACK_MODEL
        ? [activeModel, DEFAULT_PRIMARY_MODEL]
        : [activeModel, DEFAULT_FALLBACK_MODEL];

    let lastStatus = 502;
    let lastBody = JSON.stringify({ error: 'Sahadat AI service busy' });

    for (const model of modelsToTry) {
      try {
        const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://sawonak47.github.io/sahadat-portfolio/',
            'X-Title': 'Sahadat AI SEO Tool'
          },
          body: JSON.stringify({
            model,
            temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.4,
            max_tokens: Math.min(Number(payload.max_tokens) || 4096, 4096),
            reasoning: payload.reasoning || { effort: 'low' },
            messages: payload.messages || []
          })
        });

        const text = await upstream.text();
        if (upstream.ok) {
          return new Response(text, {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
          });
        }
        lastStatus = upstream.status;
        lastBody = text;
      } catch {
        // Try fallback model
      }
    }

    return new Response(lastBody, {
      status: lastStatus,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
    });
  }
};
