// CDP 验证 v22 常用联系板块: 手机视口(420x900) 加载联系方式页并截图
const http = require('http');
const fs = require('fs');

function cdp(method, params = {}, id) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ id, method, params });
    const req = http.request({ host: '127.0.0.1', port: 9222, path: '/json/new?http://127.0.0.1:8899/', method: 'PUT' }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject); req.end();
  });
}

(async () => {
  // 打开新标签
  const tab = await cdp(null, null, 1);
  console.log('tab:', tab.id);
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

  // 禁用缓存 + 手机视口
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Network.clearBrowserCache');
  await send('Emulation.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 2, mobile: true });

  // 导航到联系方式页(带缓存破坏 query)
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:8899/?t=' + Date.now() + '#/contacts' });
  await new Promise(r => setTimeout(r, 1500));

  // 检查关键内容
  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result && r.result.result ? r.result.result.value : null;
  };
  const checks = {
    '标题含 常用联系': await evalJs(`document.querySelector('.page-title').innerText.includes('常用联系')`),
    '板块标签 ⭐ 常用联系': await evalJs(`!!document.querySelector('.section-label') && document.querySelector('.section-label').innerText.includes('常用联系')`),
    '王怡坤卡片': await evalJs(`document.body.innerText.includes('王怡坤')`),
    '教务电话 010-64493208': await evalJs(`document.body.innerText.includes('010-64493208')`),
    '教务邮箱 02926': await evalJs(`document.body.innerText.includes('02926@uibe.edu.cn')`),
    '信息处邮箱 it203': await evalJs(`document.body.innerText.includes('it203@uibe.edu.cn')`),
    '信息处电话 010-64494228': await evalJs(`document.body.innerText.includes('010-64494228')`),
    '辅导员办公室 诚信楼1207': await evalJs(`document.body.innerText.includes('诚信楼1207')`),
    '院系分区标签': await evalJs(`document.body.innerText.includes('院系官方联系')`),
    '页脚来源标注': await evalJs(`document.body.innerText.includes('2026级外语学院辅导员提供')`),
    'APP_VERSION v22': await evalJs(`APP_VERSION === 'v22'`),
    '常用联系卡片数': await evalJs(`document.querySelectorAll('.common-card').length`),
  };
  let ok = true;
  for (const [k, v] of Object.entries(checks)) { console.log((v ? '✓' : '✗ FAIL'), k, v === false ? '' : (v ? '' : '') + (typeof v === 'number' ? '=' + v : '')); if (!v) ok = false; }

  // 截图
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('tools/shot-contacts-v22.png', Buffer.from(shot.result.data, 'base64'));
  console.log('截图: tools/shot-contacts-v22.png');

  // 测试搜索: 搜"教务"
  await send('Runtime.evaluate', { expression: `renderContacts('教务')` });
  await new Promise(r => setTimeout(r, 300));
  const searchCheck = await evalJs(`({n: document.querySelectorAll('.common-card').length, hasWang: document.body.innerText.includes('王怡坤'), tip: document.querySelector('.result-tip') ? document.querySelector('.result-tip').innerText : ''})`);
  console.log('搜索"教务":', JSON.stringify(searchCheck));
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('tools/shot-contacts-search-v22.png', Buffer.from(shot2.result.data, 'base64'));
  console.log('截图: tools/shot-contacts-search-v22.png');

  ws.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
