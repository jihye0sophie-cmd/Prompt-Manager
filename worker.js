const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const ALLOWED_ORIGINS = new Set([
  'https://jihye0sophie-cmd.github.io',
  'https://prompt-manager.jihye0sophie.workers.dev'
]);

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  if (!ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, PUT, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
}

function json(body, init = {}, request) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...corsHeaders(request || new Request('https://prompt-manager.jihye0sophie.workers.dev')), ...(init.headers || {}) }
  });
}

async function ensureSeed(env, request) {
  const row = await env.DB.prepare('SELECT data FROM app_state WHERE id = ?').bind('main').first();
  if (row && row.data) return JSON.parse(row.data);

  const seedUrl = new URL('/data/store.json', request.url);
  const seedResponse = await env.ASSETS.fetch(new Request(seedUrl, request));
  if (!seedResponse.ok) throw new Error('초기 데이터 파일을 불러오지 못했습니다.');
  const seed = await seedResponse.json();

  await env.DB.prepare(
    'INSERT OR REPLACE INTO app_state (id, data, updated_at) VALUES (?, ?, ?)'
  ).bind('main', JSON.stringify(seed), new Date().toISOString()).run();

  return seed;
}

function isValidStore(value) {
  return value && Array.isArray(value.prompts) && Array.isArray(value.sites);
}

function isAllowedWriteOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  return ALLOWED_ORIGINS.has(origin);
}

async function handleApi(request, env) {
  if (request.method === 'GET') {
    try {
      const data = await ensureSeed(env, request);
      return json({ ok: true, data }, {}, request);
    } catch (error) {
      return json({ ok: false, error: error.message || '데이터를 불러오지 못했습니다.' }, { status: 500 }, request);
    }
  }

  if (request.method === 'PUT') {
    if (!isAllowedWriteOrigin(request)) {
      return json({ ok: false, error: '허용되지 않은 저장 요청입니다.' }, { status: 403 }, request);
    }
    try {
      const body = await request.json();
      if (!isValidStore(body)) {
        return json({ ok: false, error: '저장 데이터 형식이 올바르지 않습니다.' }, { status: 400 }, request);
      }

      const next = {
        prompts: body.prompts,
        sites: body.sites,
        meta: {
          ...(body.meta || {}),
          version: Math.max(Number(body.meta?.version || 0), 1),
          updated: new Date().toISOString(),
          storage: 'cloudflare-d1'
        }
      };

      await env.DB.prepare(
        'INSERT OR REPLACE INTO app_state (id, data, updated_at) VALUES (?, ?, ?)'
      ).bind('main', JSON.stringify(next), next.meta.updated).run();

      return json({ ok: true, updated: next.meta.updated }, {}, request);
    } catch (error) {
      return json({ ok: false, error: error.message || '데이터를 저장하지 못했습니다.' }, { status: 500 }, request);
    }
  }

  return json({ ok: false, error: 'Method not allowed' }, { status: 405 }, request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      const headers = corsHeaders(request);
      if (!Object.keys(headers).length) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname === '/api/health') {
      return json({ ok: true, service: 'prompt-manager', storage: 'd1' }, {}, request);
    }

    if (url.pathname === '/api/store') {
      return handleApi(request, env);
    }

    if (url.pathname === '/api/reference-image') {
      const path = url.searchParams.get('path') || '';
      if (!/^assets\/references\/[a-z0-9_-]+\/[a-zA-Z0-9가-힣_.-]+$/.test(path)) {
        return new Response('Invalid image path', { status: 400, headers: corsHeaders(request) });
      }
      const rawUrl = 'https://raw.githubusercontent.com/jihye0sophie-cmd/Prompt-Manager/main/' + path;
      const upstream = await fetch(rawUrl, { cf: { cacheTtl: 3600, cacheEverything: true } });
      if (!upstream.ok) return new Response('Image not found', { status: upstream.status, headers: corsHeaders(request) });
      const headers = new Headers(upstream.headers);
      Object.entries(corsHeaders(request)).forEach(([k,v])=>headers.set(k,v));
      headers.set('cache-control', 'public, max-age=3600');
      return new Response(upstream.body, { status: 200, headers });
    }

    return env.ASSETS.fetch(request);
  }
};
