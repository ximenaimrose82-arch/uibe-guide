// CDP 验证 v24: 攻略库生活分类新增《开学第一周食堂开放安排》《快递取件注意事项(近邻宝)》
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
    '攻略总数 80': await evalJs(`GUIDES.length === 80`),
    '生活分类篇数 21': await evalJs(`(() => { renderGuides('生活'); return document.querySelectorAll('.guide-card').length; })()`),
    '食堂攻略存在': await evalJs(`document.body.innerText.includes('开学第一周食堂开放安排')`),
    '菜谱攻略存在': await evalJs(`document.body.innerText.includes('一食堂第一周菜谱')`),
    '快递攻略存在': await evalJs(`document.body.innerText.includes('快递取件注意事项')`),
  };
  let ok = true;
  for (const [k, v] of Object.entries(checks)) { console.log((v ? '✓' : '✗ FAIL'), k, typeof v === 'number' ? '=' + v : ''); if (!v) ok = false; }

  // 展开食堂攻略
  await evalJs(`(() => {
    const h = [...document.querySelectorAll('.guide-head')].find(x => x.innerText.includes('开学第一周食堂开放安排'));
    if (h) { h.click(); h.scrollIntoView({ block: 'center' }); }
  })()`);
  await new Promise(r => setTimeout(r, 700));
  const c1 = {
    '一食堂开放': await evalJs(`document.body.innerText.includes('一食堂 开放')`),
    '民族食堂开放': await evalJs(`document.body.innerText.includes('民族食堂')`),
    '二食堂暂不开放': await evalJs(`document.body.innerText.includes('二食堂 暂不开放')`),
  };
  for (const [k, v] of Object.entries(c1)) { console.log((v ? '✓' : '✗ FAIL'), '食堂篇:', k); if (!v) ok = false; }
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('tools/shot-canteen-v24.png', Buffer.from(shot1.result.data, 'base64'));
  console.log('截图: tools/shot-canteen-v24.png');

  // 展开快递攻略
  await evalJs(`(() => {
    const h = [...document.querySelectorAll('.guide-head')].find(x => x.innerText.includes('快递取件注意事项'));
    if (h) { h.click(); h.scrollIntoView({ block: 'center' }); }
  })()`);
  await new Promise(r => setTimeout(r, 700));
  const c2 = {
    '三天时效': await evalJs(`document.body.innerText.includes('三天')`),
    '近邻宝绑定手机号': await evalJs(`document.body.innerText.includes('近邻宝') && document.body.innerText.includes('绑定手机号')`),
    '德邦大件不入柜': await evalJs(`document.body.innerText.includes('德邦') && document.body.innerText.includes('无法放入校内快递柜')`),
  };
  for (const [k, v] of Object.entries(c2)) { console.log((v ? '✓' : '✗ FAIL'), '快递篇:', k); if (!v) ok = false; }
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('tools/shot-kuaidi-v24.png', Buffer.from(shot2.result.data, 'base64'));
  console.log('截图: tools/shot-kuaidi-v24.png');

  // 展开菜谱攻略
  await evalJs(`(() => {
    const h = [...document.querySelectorAll('.guide-head')].find(x => x.innerText.includes('一食堂第一周菜谱'));
    if (h) { h.click(); h.scrollIntoView({ block: 'start' }); }
  })()`);
  await new Promise(r => setTimeout(r, 500));
  // 加高视口让长菜谱尽量一屏显示
  await send('Emulation.setDeviceMetricsOverride', { width: 420, height: 2400, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 500));
  const c3 = {
    '周一菜谱': await evalJs(`document.body.innerText.includes('糖醋排骨') && document.body.innerText.includes('胡辣汤')`),
    '周五菜谱': await evalJs(`document.body.innerText.includes('西湖牛肉羹') && document.body.innerText.includes('川味回锅肉')`),
    '以实际供应为准': await evalJs(`document.body.innerText.includes('以当日实际供应为准')`),
  };
  for (const [k, v] of Object.entries(c3)) { console.log((v ? '✓' : '✗ FAIL'), '菜谱篇:', k); if (!v) ok = false; }
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('tools/shot-caipu-v24.png', Buffer.from(shot3.result.data, 'base64'));
  console.log('截图: tools/shot-caipu-v24.png');

  ws.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
