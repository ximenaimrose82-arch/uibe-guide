// 语法检查: 提取 index.html 内联 <script> 块 + 数据文件, 逐个编译
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// 内联脚本块(排除 src= 外部引用)
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
console.log('内联 script 块数:', blocks.length);
let fail = 0;
blocks.forEach((b, i) => {
  try { new Function(b); }
  catch (e) { fail++; console.error(`块 ${i} 语法错误:`, e.message); }
});

// 数据文件
['data-contacts.js', 'data-guides.js', 'data-faq.js', 'data-wechat.js', 'data-sites.js', 'sw.js'].forEach(f => {
  try { new Function(fs.readFileSync(f, 'utf8')); console.log(f, 'OK'); }
  catch (e) { fail++; console.error(f, '语法错误:', e.message); }
});

// 关键标记检查
const checks = {
  "APP_VERSION v22": html.includes("const APP_VERSION = 'v22'"),
  "data-contacts ?v=22": html.includes('data-contacts.js?v=22'),
  "无残留 ?v=21": !html.includes('?v=21'),
  "COMMON_CONTACTS 引用": html.includes('COMMON_CONTACTS'),
  "commonCardHTML 定义": html.includes('function commonCardHTML'),
  "filterCommon 定义": html.includes('function filterCommon'),
  "sw CACHE v22": fs.readFileSync('sw.js','utf8').includes("uibe-guide-v22"),
};
Object.entries(checks).forEach(([k, v]) => console.log(v ? '✓' : '✗ FAIL', k));
if (Object.values(checks).some(v => !v)) fail++;
console.log(fail ? `\n❌ ${fail} 处失败` : '\n✅ 全部通过');
process.exit(fail ? 1 : 0);
