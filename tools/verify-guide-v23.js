// CDP 验证 v23 攻略: 手机视口加载攻略库, 检查新攻略《办公电话查询指南》并截图
const http = require('http');
const fs = require('fs');

function newTab() {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: 9222, path: '/json/new?http://127.0.0.1:8899/', method: 'PUT' }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject); req.end();
  });
}

(async () => {
  const tab = await newTab();
  const ws = new (require('ws'))(tab.webSocketDebuggerUrl);
  let msgId = 0;
  const pending = new Map();
  ws.on('message', d => {
    const m = JSON.parse(d);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise(res => {
    const id = ++msgId; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  await new Promise(res => ws.on('open', res));

  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Network.clearBrowserCache');
  await send('Emulation.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 2, mobile: true });
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:8899/?t=' + Date.now() + '#/guides' });
  await new Promise(r => setTimeout(r, 1500));

  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result && r.result.result ? r.result.result.value : null;
  };

  const checks = {
    '攻略总数 77': await evalJs(`GUIDES.length === 77`),
    '切换到生活分类': await evalJs(`(() => { renderGuides('生活'); return document.querySelectorAll('.guide-card').length; })()`),
    '新攻略卡片存在': await evalJs(`document.body.innerText.includes('办公电话查询指南')`),
    '图标 📞': await evalJs(`(() => { const h = [...document.querySelectorAll('.guide-head')].find(x => x.innerText.includes('办公电话查询指南')); return h ? h.innerText.includes('📞') : false; })()`),
  };
  let ok = true;
  for (const [k, v] of Object.entries(checks)) { console.log((v ? '✓' : '✗ FAIL'), k, typeof v === 'number' ? '=' + v : ''); if (!v) ok = false; }

  // 展开新攻略并检查正文
  await evalJs(`(() => {
    const heads = [...document.querySelectorAll('.guide-head')];
    const target = heads.find(h => h.innerText.includes('办公电话查询指南'));
    if (target) { target.click(); target.scrollIntoView({ block: 'center' }); }
  })()`);
  await new Promise(r => setTimeout(r, 700));
  const bodyChecks = {
    '正文① 公众号公共服务': await evalJs(`document.body.innerText.includes('公共服务')`),
    '正文② 信息公开网 xxgk': await evalJs(`document.body.innerText.includes('xxgk.uibe.edu.cn')`),
    '正文③ 常用联系页': await evalJs(`document.body.innerText.includes('常用联系')`),
    '校长办公室电话': await evalJs(`document.body.innerText.includes('010-64492107')`),
  };
  for (const [k, v] of Object.entries(bodyChecks)) { console.log((v ? '✓' : '✗ FAIL'), k); if (!v) ok = false; }

  // 截图: 展开状态
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('tools/shot-guide-v23.png', Buffer.from(shot.result.data, 'base64'));
  console.log('截图: tools/shot-guide-v23.png');

  ws.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
