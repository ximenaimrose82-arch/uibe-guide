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
  "APP_VERSION v23": html.includes("const APP_VERSION = 'v23'"),
  "data-guides ?v=23": html.includes('data-guides.js?v=23'),
  "无残留 ?v=22": !html.includes('?v=22'),
  "办公电话查询指南": fs.readFileSync('data-guides.js','utf8').includes('办公电话查询指南'),
  "xxgk 信息公开网": fs.readFileSync('data-guides.js','utf8').includes('xxgk.uibe.edu.cn'),
  "sw CACHE v23": fs.readFileSync('sw.js','utf8').includes("uibe-guide-v23"),
};
Object.entries(checks).forEach(([k, v]) => console.log(v ? '✓' : '✗ FAIL', k));
if (Object.values(checks).some(v => !v)) fail++;
console.log(fail ? `\n❌ ${fail} 处失败` : '\n✅ 全部通过');
process.exit(fail ? 1 : 0);
