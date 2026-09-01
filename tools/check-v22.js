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
  "APP_VERSION v24": html.includes("const APP_VERSION = 'v24'"),
  "data-guides ?v=24": html.includes('data-guides.js?v=24'),
  "无残留 ?v=23": !html.includes('?v=23'),
  "食堂开放安排": fs.readFileSync('data-guides.js','utf8').includes('开学第一周食堂开放安排'),
  "近邻宝快递": fs.readFileSync('data-guides.js','utf8').includes('快递取件注意事项（近邻宝）'),
  "民族食堂": fs.readFileSync('data-guides.js','utf8').includes('民族食堂'),
  "sw CACHE v24": fs.readFileSync('sw.js','utf8').includes("uibe-guide-v24"),
};
Object.entries(checks).forEach(([k, v]) => console.log(v ? '✓' : '✗ FAIL', k));
if (Object.values(checks).some(v => !v)) fail++;
console.log(fail ? `\n❌ ${fail} 处失败` : '\n✅ 全部通过');
process.exit(fail ? 1 : 0);
