// ============================================================
// 贸大百事通 AI 代理 (Cloudflare Worker)
// 功能: 转发 DeepSeek API, 保护密钥, 限流, 每日熔断
// 部署: wrangler deploy  (或 Cloudflare Dashboard 手动创建)
// 环境变量: DEEPSEEK_API_KEY (必填), MODEL (可选, 默认 deepseek-chat)
// 前端调用: POST /api/chat  { "question": "军训多久？" }
// 响应:     { "answer": "...", "model": "...", "from": "deepseek" }
// ============================================================

const ALLOWED_PATHS = new Set(['/', '/api/chat', '/chat']);
const MAX_BODY_BYTES = 64 * 1024; // 64KB
const UPSTREAM_TIMEOUT_MS = 20000; // DeepSeek 最长等待 20 秒

export default {
  async fetch(request, env) {
    // ---------- CORS 预检 ----------
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    // ---------- 健康检查 ----------
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return json({ ok: true, name: 'uibe-ai-proxy', status: 'running' });
    }

    if (request.method !== 'POST') {
      return json({ error: '只支持 POST 请求' }, 405);
    }
    if (!ALLOWED_PATHS.has(url.pathname)) {
      return json({ error: '路径不存在' }, 404);
    }

    // ---------- 请求体大小限制(防滥用) ----------
    // 先看 content-length 快速拒绝; 分块传输时无该头, 以实际文本字节数为准
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return json({ error: '请求体过大' }, 413);
    }

    // ---------- 限流 (内存版, 按 IP) ----------
    // 说明: Worker 内存级计数只在单个 isolate 内有效, 个人站量级够用;
    //       若流量变大, 建议换成 KV 计数(见注释代码)。
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const minKey = `m:${ip}:${Math.floor(now / 60000)}`;    // 每分钟
    const dayKey = `d:${ip}:${Math.floor(now / 86400000)}`; // 每天

    env.bucket = env.bucket || {};
    env.bucket[minKey] = (env.bucket[minKey] || 0) + 1;
    env.bucket[dayKey] = (env.bucket[dayKey] || 0) + 1;

    if (env.bucket[minKey] > 5) {
      return json({ error: '提问太频繁啦，每分钟最多 5 次，歇会儿再问吧～' }, 429);
    }
    if (env.bucket[dayKey] > 30) {
      return json({ error: '今天的免费提问次数用完啦（30 次/人），明天再来吧～' }, 429);
    }

    // ---------- 每日预算熔断 (按请求数估算, 防被盗刷) ----------
    const today = Math.floor(now / 86400000);
    env.budget = env.budget || { day: 0, d: today };
    if (env.budget.d !== today) env.budget = { day: 0, d: today };
    if (env.budget.day > 500) {
      return json({ error: '今日 AI 用量已达上限，明天再来吧～' }, 429);
    }

    // ---------- 解析请求 ----------
    let raw;
    try { raw = await request.text(); }
    catch (e) { return json({ error: '请求格式错误' }, 400); }
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      return json({ error: '请求体过大' }, 413);
    }
    let body;
    try { body = JSON.parse(raw); }
    catch (e) { return json({ error: '请求格式错误' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ error: '请求格式错误' }, 400);
    }

    const question = String(body.question ?? body.message ?? '').trim().slice(0, 300);
    if (!question) return json({ error: '问题不能为空' }, 400);

    // ---------- 调用 DeepSeek ----------
    if (!env.DEEPSEEK_API_KEY) {
      return json({ error: '服务器未配置 API Key，请联系站长' }, 500);
    }

    const model = env.MODEL || 'deepseek-chat';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let resp;
    try {
      resp = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + env.DEEPSEEK_API_KEY,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: '你是「贸大百事通」，专门回答对外经济贸易大学（UIBE）2026级新生的问题。' +
                       '知识范围：报到流程、缴费、军训、选课、宿舍食堂生活、防骗、资助、国际交流、校园系统。' +
                       '回答要求：简洁、友好、口语化，用简体中文，控制在150字以内。不知道的就说"这个我还不确定，建议咨询辅导员"。'
            },
            { role: 'user', content: question },
          ],
          max_tokens: 300,
          temperature: 0.7,
          stream: false,
        }),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      return json({ error: 'AI 服务暂时不可用，请稍后再试' }, 502);
    }
    clearTimeout(timer);

    env.budget.day += 1; // 计入预算(无论上游成败都计, 防止重试刷量)

    // 上游可能返回非 JSON(如网关错误页), 先取文本再解析
    const text = await resp.text();
    let data = null;
    try { data = JSON.parse(text); } catch (e) { /* 忽略, 走统一错误 */ }

    if (!resp.ok || !data) {
      return json({
        error: 'AI 服务暂时不可用，请稍后再试',
        detail: (data && data.error && data.error.message) || '',
      }, 502);
    }

    const answer = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
      ? data.choices[0].message.content.trim()
      : '抱歉，我暂时无法回答这个问题。';

    return json({ answer: answer, model: data.model || model, from: 'deepseek' });
  },
};

// ---------- 工具函数 ----------
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() },
  });
}

// ---------- 升级到 KV 限流的参考写法(可选) ----------
// 在 wrangler.toml 中配置 [[kv_namespaces]] 后:
// const minKey = `m:${ip}:${Math.floor(now / 60000)}`;
// const cnt = Number(await env.KV.get(minKey, 'text') || 0);
// if (cnt >= 5) return json({ error: '提问太频繁啦' }, 429);
// await env.KV.put(minKey, String(cnt + 1), { expirationTtl: 120 });
