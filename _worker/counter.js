// 具志アンデルソン飛雄馬 公式サイト (jinken-gushi.com) の訪問者カウンター
//
//   GET  /visits  → 今の数を返すだけ
//   POST /visits  → 1 つ増やして返す (サイト側で 1 セッション 1 回だけ呼ぶ)
//   返り値: { "count": 123 }
//
// 前に使っていた CounterAPI v1 (api.counterapi.dev) は廃止 (410 Gone) され、
// 実績値も取り出せないため 0 から数え直し。 下駄を履かせたい時は
// wrangler.toml の VISITS_BASE に数値を入れて deploy する。
//
// KV は読んで書く間に割り込まれ得るので厳密ではないが、 訪問者数は
// 1 件ずれても実害が無いのでこれで足りる。 書き込みは 1 訪問 1 回
// (KV の無料枠は 1 日 1,000 回)。

const VISITS_KEY = 'visits:total';

const ALLOWED_ORIGINS = [
  'https://jinken-gushi.com',
  'https://www.jinken-gushi.com',
  'https://gushi-hyuma.pages.dev',
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(request),
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    if (url.pathname !== '/visits') {
      return json(request, { error: 'not found' }, 404);
    }
    if (request.method !== 'GET' && request.method !== 'POST') {
      return json(request, { error: 'method not allowed' }, 405);
    }
    try {
      const base = parseInt(env.VISITS_BASE || '0', 10) || 0;
      let total = parseInt((await env.GUSHI_VISITS.get(VISITS_KEY)) || '0', 10) || 0;
      if (request.method === 'POST') {
        total += 1;
        // TTL 無し = 期限で消えない
        await env.GUSHI_VISITS.put(VISITS_KEY, String(total));
      }
      return json(request, { count: total + base });
    } catch (e) {
      return json(request, { error: String(e) }, 500);
    }
  },
};
