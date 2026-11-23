/**
 * Sahadat AI — Universal Multi-Provider Cloudflare Worker Proxy (Free Tier)
 * -------------------------------------------------------------------------
 * Supports ANY AI API key automatically (auto-detected by key prefix or selected in Admin):
 *   • OpenRouter       (sk-or-...)   -> default: nvidia/nemotron-3.5-super-vl:free
 *   • OpenAI           (sk-...)      -> default: gpt-4o-mini
 *   • Google Gemini    (AIza...)     -> default: gemini-2.5-flash
 *   • Anthropic Claude (sk-ant-...)  -> default: claude-sonnet-4-20250514
 *   • Groq             (gsk_...)     -> default: meta-llama/llama-4-scout-17b-16e-instruct
 *   • xAI (Grok)       (xai-...)     -> default: grok-2-vision-latest
 *   • Custom OpenAI-Compatible Endpoint (Mistral, Together, Fireworks, DeepSeek, etc.)
 *
 * Public visitors NEVER see the provider, model, or API key — only "Sahadat AI".
 * Admin updates persist globally via Cloudflare KV (binding: SAHADAT_KV).
 *
 * Required Cloudflare Secrets:
 *   • OPENROUTER_API_KEY  (initial default key)
 *   • ADMIN_PASSWORD      (e.g. sawonak47)
 */

const ALLOWED_ORIGINS = [
  'https://sawonak47.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765'
];

const PROVIDERS = {
  openrouter: {
    label: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'nvidia/nemotron-3.5-super-vl:free',
    fallbackModel: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    style: 'openai'
  },
  openai: {
    label: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    fallbackModel: 'gpt-4o',
    style: 'openai'
  },
  gemini: {
    label: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    defaultModel: 'gemini-2.5-flash',
    fallbackModel: 'gemini-2.0-flash',
    style: 'openai'
  },
  anthropic: {
    label: 'Anthropic Claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-sonnet-4-20250514',
    fallbackModel: 'claude-3-5-sonnet-latest',
    style: 'anthropic'
  },
  groq: {
    label: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
    fallbackModel: 'llama-3.2-90b-vision-preview',
    style: 'openai'
  },
  xai: {
    label: 'xAI (Grok)',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    defaultModel: 'grok-2-vision-latest',
    fallbackModel: 'grok-2-vision-1212',
    style: 'openai'
  },
  custom: {
    label: 'Custom OpenAI-Compatible',
    endpoint: '',
    defaultModel: 'gpt-4o-mini',
    fallbackModel: '',
    style: 'openai'
  }
};

function detectProviderFromKey(key) {
  const k = String(key || '').trim();
  if (k.startsWith('sk-or-')) return 'openrouter';
  if (k.startsWith('sk-ant-')) return 'anthropic';
  if (k.startsWith('AIza')) return 'gemini';
  if (k.startsWith('gsk_')) return 'groq';
  if (k.startsWith('xai-')) return 'xai';
  if (k.startsWith('sk-')) return 'openai';
  return 'openrouter';
}

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
  return `${key.slice(0, 10)}•••${key.slice(-4)}`;
}

async function kvGet(env, key) {
  if (!env.SAHADAT_KV) return null;
  try {
    const val = await env.SAHADAT_KV.get(key);
    return val ? val.trim() : null;
  } catch {
    return null;
  }
}

async function getActiveConfig(env) {
  const kvKey = await kvGet(env, 'active_api_key');
  const apiKey = kvKey || (env.OPENROUTER_API_KEY || '').trim();

  const kvProvider = await kvGet(env, 'active_provider');
  const provider = (kvProvider && PROVIDERS[kvProvider]) ? kvProvider : detectProviderFromKey(apiKey);
  const spec = PROVIDERS[provider] || PROVIDERS.openrouter;

  const kvModel = await kvGet(env, 'active_model');
  const model = kvModel || spec.defaultModel;

  const kvEndpoint = await kvGet(env, 'active_endpoint');
  const endpoint = provider === 'custom' ? (kvEndpoint || '') : spec.endpoint;

  const updatedAt = (await kvGet(env, 'updated_at')) || 'Initial secret';

  return { apiKey, provider, providerLabel: spec.label, model, endpoint, updatedAt, spec };
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

async function validateProviderKey(provider, apiKey, customEndpoint) {
  try {
    if (provider === 'openrouter') {
      const r = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return r.ok;
    }
    if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return r.ok;
    }
    if (provider === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
      return r.ok;
    }
    if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      });
      return r.ok;
    }
    if (provider === 'groq') {
      const r = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return r.ok;
    }
    if (provider === 'xai') {
      const r = await fetch('https://api.x.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return r.ok;
    }
    if (provider === 'custom') {
      return Boolean(customEndpoint && /^https:\/\//i.test(customEndpoint) && apiKey.length >= 6);
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchLiveModelsForProvider(provider, apiKey) {
  try {
    if (provider === 'openrouter') {
      const r = await fetch('https://openrouter.ai/api/v1/models');
      if (!r.ok) return [];
      const data = await r.json();
      return (data.data || [])
        .filter(m => {
          const mods = (m.architecture && m.architecture.input_modalities) || [];
          return mods.includes('image') || /vl|vision|gpt-4o|gemini|claude/i.test(m.id || '');
        })
        .sort((a, b) => {
          const aFree = String(a.id || '').includes(':free') ? 0 : 1;
          const bFree = String(b.id || '').includes(':free') ? 0 : 1;
          return aFree - bFree;
        })
        .slice(0, 60)
        .map(m => ({ id: m.id, label: m.id.includes(':free') ? `${m.id} (Free)` : m.id }));
    }
    if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!r.ok) return [];
      const data = await r.json();
      return (data.data || [])
        .filter(m => /gpt-4|gpt-5|o1|o3|o4|chatgpt/i.test(m.id || ''))
        .sort((a, b) => (b.created || 0) - (a.created || 0))
        .slice(0, 40)
        .map(m => ({ id: m.id, label: m.id }));
    }
    if (provider === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
      if (!r.ok) return [];
      const data = await r.json();
      return (data.models || [])
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => String(m.name || '').replace(/^models\//, ''))
        .filter(id => /gemini/i.test(id))
        .slice(0, 30)
        .map(id => ({ id, label: id }));
    }
    if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
      });
      if (!r.ok) return [];
      const data = await r.json();
      return (data.data || []).slice(0, 30).map(m => ({ id: m.id, label: m.display_name ? `${m.display_name} (${m.id})` : m.id }));
    }
    if (provider === 'groq') {
      const r = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!r.ok) return [];
      const data = await r.json();
      return (data.data || []).slice(0, 30).map(m => ({ id: m.id, label: m.id }));
    }
    if (provider === 'xai') {
      const r = await fetch('https://api.x.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!r.ok) return [];
      const data = await r.json();
      return (data.data || []).slice(0, 30).map(m => ({ id: m.id, label: m.id }));
    }
    return [];
  } catch {
    return [];
  }
}

// Convert OpenAI-style multimodal messages to Anthropic Messages API format
function buildAnthropicBody(messages, model, temperature, maxTokens) {
  let systemText = '';
  const anthMessages = [];

  for (const msg of (messages || [])) {
    if (msg.role === 'system') {
      systemText += (systemText ? '\n' : '') + (typeof msg.content === 'string' ? msg.content : '');
      continue;
    }
    if (typeof msg.content === 'string') {
      anthMessages.push({ role: msg.role, content: msg.content });
      continue;
    }
    if (Array.isArray(msg.content)) {
      const blocks = [];
      for (const part of msg.content) {
        if (part.type === 'text') {
          blocks.push({ type: 'text', text: part.text || '' });
        } else if (part.type === 'image_url' && part.image_url && part.image_url.url) {
          const m = String(part.image_url.url).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
          if (m) {
            blocks.push({
              type: 'image',
              source: { type: 'base64', media_type: m[1], data: m[2] }
            });
          }
        }
      }
      anthMessages.push({ role: msg.role, content: blocks });
    }
  }

  return {
    model,
    max_tokens: Math.min(Number(maxTokens) || 4096, 4096),
    temperature: typeof temperature === 'number' ? temperature : 0.4,
    system: systemText || undefined,
    messages: anthMessages
  };
}

async function callUpstreamModel(cfg, model, payload) {
  // Anthropic Messages API adapter
  if (cfg.spec.style === 'anthropic') {
    const res = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(buildAnthropicBody(payload.messages, model, payload.temperature, payload.max_tokens))
    });
    const raw = await res.text();
    if (!res.ok) return { ok: false, status: res.status, text: raw };

    // Normalize Anthropic response into OpenAI chat.completion shape for frontend compatibility
    const parsed = JSON.parse(raw);
    const textContent = (parsed.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');
    return {
      ok: true,
      status: 200,
      text: JSON.stringify({
        choices: [{ message: { role: 'assistant', content: textContent } }]
      })
    };
  }

  // OpenAI-compatible providers (OpenRouter, OpenAI, Gemini, Groq, xAI, Custom)
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${cfg.apiKey}`
  };
  if (cfg.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://sawonak47.github.io/sahadat-portfolio/';
    headers['X-Title'] = 'Sahadat AI SEO Tool';
  }

  const reqBody = {
    model,
    temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.4,
    max_tokens: Math.min(Number(payload.max_tokens) || 4096, 4096),
    messages: payload.messages || []
  };

  // Pass reasoning hint only for OpenRouter Nemotron reasoning models
  if (cfg.provider === 'openrouter' && /nemotron/i.test(model)) {
    reqBody.reasoning = payload.reasoning || { effort: 'low' };
  }

  const res = await fetch(cfg.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(reqBody)
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ── HEALTH CHECK (never leaks key/provider details publicly) ──
    if (request.method === 'GET' && (path === '/' || path === '/health')) {
      const cfg = await getActiveConfig(env);
      return jsonResponse({
        ok: true,
        engine: 'Sahadat AI',
        live: Boolean(cfg.apiKey && cfg.endpoint),
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

    // ── ADMIN: VERIFY PASSWORD & RETURN MASKED STATUS ──
    if (path === '/admin/verify') {
      const auth = checkAdminPassword(payload.password, env);
      if (!auth.ok) return jsonResponse({ ok: false, error: auth.error }, auth.status, origin);

      const cfg = await getActiveConfig(env);
      return jsonResponse({
        ok: true,
        maskedKey: maskKey(cfg.apiKey),
        hasKey: Boolean(cfg.apiKey),
        kvEnabled: Boolean(env.SAHADAT_KV),
        activeProvider: cfg.provider,
        providerLabel: cfg.providerLabel,
        activeModel: cfg.model,
        activeEndpoint: cfg.provider === 'custom' ? cfg.endpoint : '',
        updatedAt: cfg.updatedAt
      }, 200, origin);
    }

    // ── ADMIN: FETCH LIVE MODELS FOR SELECTED / DETECTED PROVIDER ──
    if (path === '/admin/models') {
      const auth = checkAdminPassword(payload.password, env);
      if (!auth.ok) return jsonResponse({ ok: false, error: auth.error }, auth.status, origin);

      const currentCfg = await getActiveConfig(env);
      const testKey = String(payload.apiKey || '').trim() || currentCfg.apiKey;
      const reqProvider = String(payload.provider || 'auto').trim().toLowerCase();
      const targetProvider = (reqProvider !== 'auto' && PROVIDERS[reqProvider])
        ? reqProvider
        : (testKey ? detectProviderFromKey(testKey) : currentCfg.provider);

      const models = await fetchLiveModelsForProvider(targetProvider, testKey);
      return jsonResponse({
        ok: true,
        provider: targetProvider,
        providerLabel: (PROVIDERS[targetProvider] || PROVIDERS.openrouter).label,
        models
      }, 200, origin);
    }

    // ── ADMIN: UPDATE ANY PROVIDER API KEY / MODEL IN CLOUDFLARE KV ──
    if (path === '/admin/update-key') {
      const auth = checkAdminPassword(payload.password, env);
      if (!auth.ok) return jsonResponse({ ok: false, error: auth.error }, auth.status, origin);

      if (!env.SAHADAT_KV) {
        return jsonResponse({
          ok: false,
          error: 'Cloudflare KV binding "SAHADAT_KV" is not attached to this Worker.'
        }, 500, origin);
      }

      const currentCfg = await getActiveConfig(env);
      const newKey = String(payload.apiKey || '').trim();
      const requestedProvider = String(payload.provider || 'auto').trim().toLowerCase();
      const newModel = String(payload.model || '').trim();
      const customEndpoint = String(payload.endpoint || '').trim();

      if (!newKey && !newModel && requestedProvider === 'auto' && !customEndpoint) {
        return jsonResponse({ ok: false, error: 'Enter a new API key or model to update.' }, 400, origin);
      }

      // Resolve target provider (auto-detect from key prefix if provider === 'auto')
      let targetProvider;
      if (requestedProvider !== 'auto' && PROVIDERS[requestedProvider]) {
        targetProvider = requestedProvider;
      } else if (newKey) {
        targetProvider = detectProviderFromKey(newKey);
      } else {
        targetProvider = currentCfg.provider;
      }

      const targetSpec = PROVIDERS[targetProvider] || PROVIDERS.openrouter;
      const targetEndpoint = targetProvider === 'custom'
        ? (customEndpoint || currentCfg.endpoint)
        : targetSpec.endpoint;

      if (targetProvider === 'custom' && !/^https:\/\//i.test(targetEndpoint)) {
        return jsonResponse({ ok: false, error: 'Custom provider requires a valid https:// chat completions URL.' }, 400, origin);
      }

      // Live-validate any newly supplied key before replacing the old one
      if (newKey) {
        const valid = await validateProviderKey(targetProvider, newKey, targetEndpoint);
        if (!valid) {
          return jsonResponse({
            ok: false,
            error: `That ${targetSpec.label} API key could not be verified (invalid key or wrong provider). Your old key was kept safe.`
          }, 400, origin);
        }
        await env.SAHADAT_KV.put('active_api_key', newKey);
      }

      // Save provider + reset model to the new provider's default if switching providers without specifying a model
      const providerChanged = targetProvider !== currentCfg.provider;
      await env.SAHADAT_KV.put('active_provider', targetProvider);

      if (newModel) {
        await env.SAHADAT_KV.put('active_model', newModel);
      } else if (providerChanged) {
        await env.SAHADAT_KV.put('active_model', targetSpec.defaultModel);
      }

      if (targetProvider === 'custom' && targetEndpoint) {
        await env.SAHADAT_KV.put('active_endpoint', targetEndpoint);
      } else {
        await env.SAHADAT_KV.delete('active_endpoint');
      }

      const nowIso = new Date().toISOString();
      await env.SAHADAT_KV.put('updated_at', nowIso);

      const updatedCfg = await getActiveConfig(env);
      return jsonResponse({
        ok: true,
        message: `Connected to ${updatedCfg.providerLabel} (${updatedCfg.model}) globally for all visitors!`,
        maskedKey: maskKey(updatedCfg.apiKey),
        activeProvider: updatedCfg.provider,
        providerLabel: updatedCfg.providerLabel,
        activeModel: updatedCfg.model,
        activeEndpoint: updatedCfg.provider === 'custom' ? updatedCfg.endpoint : '',
        updatedAt: nowIso
      }, 200, origin);
    }

    // ── PUBLIC: SAHADAT AI SEO GENERATION ──
    const cfg = await getActiveConfig(env);
    if (!cfg.apiKey || !cfg.endpoint) {
      return jsonResponse({ error: 'Sahadat AI server is not configured.' }, 500, origin);
    }

    const modelsToTry = [cfg.model];
    if (cfg.spec.fallbackModel && cfg.spec.fallbackModel !== cfg.model) {
      modelsToTry.push(cfg.spec.fallbackModel);
    }

    let lastStatus = 502;
    let lastBody = JSON.stringify({ error: 'Sahadat AI service busy' });

    for (const model of modelsToTry) {
      try {
        const result = await callUpstreamModel(cfg, model, payload);
        if (result.ok) {
          return new Response(result.text, {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
          });
        }
        lastStatus = result.status;
        lastBody = result.text;
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
