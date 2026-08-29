# -*- coding: utf-8 -*-
# ============================================================
# 贸大百事通 AI 代理 · 腾讯云函数版 (SCF) · 仅标准库
# 功能: 国内可达的 DeepSeek 转发层, 保护密钥, 限流, 每日熔断
# 依赖: 仅 Python 标准库(urllib), 不依赖第三方包
# 部署: 腾讯云 SCF, 执行方法 index.main_handler, 事件函数 + 函数URL
# 环境变量: DEEPSEEK_API_KEY (必填), MODEL (可选, 默认 deepseek-chat)
# 前端调用: POST /api/chat  { "question": "军训多久？" }
# ============================================================
import json
import os
import time
import urllib.request
import urllib.error

_bucket = {}   # 限流计数(实例内存级)
_budget = {}   # 每日预算

SYSTEM_PROMPT = (
    '你是「贸大百事通」，专门回答对外经济贸易大学新生的问题。'
    '回答简洁友好，用中文，150字以内。不确定的不要编造，'
    '可以说"以学校官方通知为准"。'
)

ALLOWED_PATHS = ('/', '/api/chat', '/chat')
MAX_BODY_BYTES = 64 * 1024


def main_handler(event, context):
    method = (event.get('httpMethod') or 'GET').upper()
    if method == 'OPTIONS':
        return _resp(204, '', cors=True)

    path = event.get('path') or '/'
    if method == 'GET' and path in ('/', '/health'):
        return _resp(200, {'ok': True, 'name': 'uibe-ai-proxy-cn'})

    if method != 'POST':
        return _resp(405, {'error': '只支持 POST 请求'})
    if path not in ALLOWED_PATHS:
        return _resp(404, {'error': '路径不存在'})

    # 解析 body, 限制大小
    body = event.get('body') or '{}'
    if event.get('isBase64Encoded'):
        import base64
        try:
            body = base64.b64decode(body).decode('utf-8')
        except Exception:
            body = '{}'
    if isinstance(body, str) and len(body.encode('utf-8')) > MAX_BODY_BYTES:
        return _resp(413, {'error': '请求体过大'})
    try:
        data = json.loads(body) if isinstance(body, str) else (body or {})
    except Exception:
        return _resp(400, {'error': '请求格式错误'})
    if not isinstance(data, dict):
        return _resp(400, {'error': '请求格式错误'})

    # ---- 限流: 5次/分, 30次/天/人 ----
    ip = _get_ip(event)
    now = int(time.time())
    min_key = 'm:%s:%d' % (ip, now // 60)
    day_key = 'd:%s:%d' % (ip, now // 86400)
    _bucket[min_key] = _bucket.get(min_key, 0) + 1
    _bucket[day_key] = _bucket.get(day_key, 0) + 1
    if _bucket[min_key] > 5:
        return _resp(429, {'error': '提问太频繁啦，每分钟最多 5 次，歇会儿再问吧～'})
    if _bucket[day_key] > 30:
        return _resp(429, {'error': '今天的免费提问次数用完啦（30 次/人），明天再来吧～'})

    # ---- 每日熔断: 500 次/天 ----
    today = now // 86400
    if _budget.get('d') != today:
        _budget.clear()
        _budget['d'] = today
    if _budget.get('count', 0) > 500:
        return _resp(429, {'error': '今日 AI 用量已达上限，明天再来吧～'})

    question = str(data.get('question') or data.get('message') or '').strip()[:300]
    if not question:
        return _resp(400, {'error': '问题不能为空'})

    api_key = os.environ.get('DEEPSEEK_API_KEY', '').strip()
    if not api_key:
        return _resp(500, {'error': '服务器未配置 API Key，请联系站长'})

    # ---- 调用 DeepSeek ----
    status, data_resp = _call_deepseek(api_key, question, os.environ.get('MODEL', 'deepseek-chat'))
    _budget['count'] = _budget.get('count', 0) + 1  # 无论成败都计入预算, 防重试刷量

    if status == 200:
        try:
            answer = data_resp['choices'][0]['message']['content'].strip()
            return _resp(200, {'answer': answer, 'model': data_resp.get('model', 'deepseek-chat'), 'from': 'tencent-scf'})
        except Exception:
            return _resp(502, {'error': 'AI 返回格式异常'})

    err_msg = ''
    try:
        err_msg = data_resp.get('error', {}).get('message', '')
    except Exception:
        pass
    if status == 401:
        return _resp(502, {'error': 'API Key 无效，请联系站长'})
    if status == 429:
        return _resp(502, {'error': 'AI 服务繁忙，请稍后再试～'})
    return _resp(502, {'error': 'AI 服务暂时不可用，请稍后再试', 'detail': str(err_msg)[:120]})


def _call_deepseek(api_key, question, model):
    url = 'https://api.deepseek.com/chat/completions'
    payload = json.dumps({
        'model': model,
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': question},
        ],
        'max_tokens': 300,
        'temperature': 0.7,
        'stream': False,
    }).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + api_key,
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode('utf-8'))
        except Exception:
            return e.code, {}
    except Exception as e:
        return 502, {'error': {'message': str(e)}}


def _get_ip(event):
    headers = event.get('headers') or {}
    fwd = headers.get('X-Forwarded-For') or headers.get('x-forwarded-for') or 'unknown'
    return str(fwd).split(',')[0].strip() or 'unknown'


def _resp(status, obj, cors=True):
    headers = {'Content-Type': 'application/json; charset=utf-8'}
    if cors:
        headers['Access-Control-Allow-Origin'] = '*'
        headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
        headers['Access-Control-Allow-Headers'] = 'Content-Type'
        headers['Access-Control-Max-Age'] = '86400'
    return {
        'statusCode': status,
        'headers': headers,
        'body': json.dumps(obj, ensure_ascii=False),
        'isBase64Encoded': False,
    }
