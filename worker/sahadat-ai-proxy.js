/**
 * Sahadat AI — Cloudflare Worker Secure Proxy
 * Keeps your OpenRouter API key completely private on the server side
 * so public visitors on GitHub Pages can use Sahadat AI with zero exposed keys.
 *
 * Setup (Free Cloudflare Workers tier — 100,000 requests/day):
 * 1. Create a Worker in Cloudflare Dashboard (or `npx wrangler deploy`)
 * 2. Add an encrypted Secret named: OPENROUTER_API_KEY
 * 3. Paste your Worker URL into SAHADAT_AI_CONFIG.proxyUrl in ai-seo-tool.js
 */

const ALLOWED_ORIGINS = [
  'https://sawonak47.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765'
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
      });
    }

    if (!env.OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: 'Sahadat AI server key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
      });
    }

    try {
      const payload = await request.json();
      const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://sawonak47.github.io/sahadat-portfolio/',
          'X-Title': 'Sahadat AI SEO Tool'
        },
        body: JSON.stringify({
          model: payload.model || 'nvidia/nemotron-3.5-super-vl:free',
          temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.4,
          max_tokens: Math.min(Number(payload.max_tokens) || 4096, 4096),
          reasoning: payload.reasoning || { effort: 'low' },
          messages: payload.messages || []
        })
      });

      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Proxy request failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
      });
    }
  }
};
