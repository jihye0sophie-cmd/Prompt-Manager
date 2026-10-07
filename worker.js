const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init.headers || {}) }
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

async function handleApi(request, env) {
  if (request.method === 'GET') {
    try {
      const data = await ensureSeed(env, request);
      return json({ ok: true, data });
    } catch (error) {
      return json({ ok: false, error: error.message || '데이터를 불러오지 못했습니다.' }, { status: 500 });
    }
  }

  if (request.method === 'PUT') {
    const origin = request.headers.get('Origin');
    if (!origin || new URL(origin).host !== new URL(request.url).host) {
      return json({ ok: false, error: '허용되지 않은 저장 요청입니다.' }, { status: 403 });
    }
    try {
      const body = await request.json();
      if (!isValidStore(body)) {
        return json({ ok: false, error: '저장 데이터 형식이 올바르지 않습니다.' }, { status: 400 });
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

      return json({ ok: true, updated: next.meta.updated });
    } catch (error) {
      return json({ ok: false, error: error.message || '데이터를 저장하지 못했습니다.' }, { status: 500 });
    }
  }

  return json({ ok: false, error: 'Method not allowed' }, { status: 405 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({ ok: true, service: 'prompt-manager', storage: 'd1' });
    }

    if (url.pathname === '/api/store') {
      return handleApi(request, env);
    }

    if (url.pathname === '/api/reference-image') {
      const path = url.searchParams.get('path') || '';
      if (!/^assets\/references\/[a-z0-9_-]+\/[a-zA-Z0-9가-힣_.-]+$/.test(path)) {
        return new Response('Invalid image path', { status: 400 });
      }
      const rawUrl = 'https://raw.githubusercontent.com/jihye0sophie-cmd/Prompt-Manager/main/' + path;
      const upstream = await fetch(rawUrl, { cf: { cacheTtl: 3600, cacheEverything: true } });
      if (!upstream.ok) return new Response('Image not found', { status: upstream.status });
      const headers = new Headers(upstream.headers);
      headers.set('cache-control', 'public, max-age=3600');
      return new Response(upstream.body, { status: 200, headers });
    }

    return env.ASSETS.fetch(request);
  }
};
