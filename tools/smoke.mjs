// ============================================================
// 冒烟测试: 数据完整性 + 页面核心逻辑(纯函数部分)
// 用法:  node tools/smoke.mjs   (或 npm run check)
// 说明:  不需要浏览器, 在 Node 中直接加载数据文件并运行
//        index.html 里的匹配/转义/倒计时逻辑, 防止改版改坏核心功能
// ============================================================
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---- 1. 加载数据文件(改为 globalThis 赋值, 便于跨模块读取) ----
let faqCode = readFileSync(join(root, 'data-faq.js'), 'utf8').replace(/^const (FAQ|GUIDES) = /m, 'globalThis.$1 = ');
let guidesCode = readFileSync(join(root, 'data-guides.js'), 'utf8').replace(/^const (FAQ|GUIDES) = /m, 'globalThis.$1 = ');
let contactsCode = readFileSync(join(root, 'data-contacts.js'), 'utf8').replace(/^const (FAQ|GUIDES|CONTACTS) = /m, 'globalThis.$1 = ');
(0, eval)(faqCode);
(0, eval)(guidesCode);
(0, eval)(contactsCode);

const FAQ = globalThis.FAQ;
const GUIDES = globalThis.GUIDES;
const CONTACTS = globalThis.CONTACTS;

let problems = 0;
FAQ.forEach((f, i) => {
  if (!f.q || !f.a || !Array.isArray(f.kws) || f.kws.length === 0) { console.log(`FAQ[${i}] 缺少字段`, f); problems++; }
});
GUIDES.forEach((g, i) => {
  if (!g.cat || !g.title || !g.body) { console.log(`GUIDES[${i}] 缺少字段`, g); problems++; }
});
CONTACTS.forEach((c, i) => {
  if (!c.name || !c.site || !c.source) { console.log(`CONTACTS[${i}] 缺少必填字段(name/site/source)`, c); problems++; }
  for (const f of ['phone', 'email', 'location']) {
    if (typeof c[f] !== 'string' || c[f].trim() === '') { console.log(`CONTACTS[${i}] 字段 ${f} 为空`, c); problems++; }
  }
});
const telRe = /^(010-)?\d{7,8}([/、]\d{2,8})*$/;
CONTACTS.forEach((c, i) => {
  if (c.phone !== '待补充' && !telRe.test(c.phone.replace(/\s/g, ''))) {
    console.log(`CONTACTS[${i}] 电话格式异常: "${c.phone}"`); problems++;
  }
});
console.log(`数据完整性: FAQ=${FAQ.length} 条, GUIDES=${GUIDES.length} 篇, CONTACTS=${CONTACTS.length} 条, 问题数=${problems}`);

// ---- 2. 加载 index.html 的主脚本(最后一个无 src 的 <script>) ----
const html = readFileSync(join(root, 'index.html'), 'utf8');
const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const js = inlineScripts[inlineScripts.length - 1] + '\n;return { esc, highlight, countdownText, daysUntil, matchFaq, matchGuide, msgHTML, ALL_KEYS, MAP_LANDMARKS, filterContacts, contactCardHTML };';

const els = {};
global.document = {
  addEventListener() {},
  getElementById: (id) => els[id] || (els[id] = {
    innerHTML: '', value: '', textContent: '', scrollTop: 0, scrollHeight: 0,
    style: {}, dataset: {},
    insertAdjacentHTML() {}, setAttribute() {},
    querySelector: () => null, querySelectorAll: () => [],
    classList: { toggle() {}, add() {}, remove() {}, contains: () => false },
    addEventListener() {},
  }),
  createElement: () => ({ style: {}, select() {}, remove() {}, appendChild() {} }),
  body: { appendChild() {} },
  querySelector: () => null,
  querySelectorAll: () => [],
};
global.localStorage = { getItem: () => null, setItem() {} };
global.window = { addEventListener() {}, scrollTo() {}, isSecureContext: true };
Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
Object.defineProperty(global, 'location', { value: { hash: '#/home', protocol: 'http:', href: 'http://x/' }, configurable: true });

const api = new Function('window', 'document', 'localStorage', 'navigator', 'location', js)(
  global.window, global.document, global.localStorage, global.navigator, global.location
);

// ---- 3. 断言 ----
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); }
}

check('esc 转义 <b> → &lt;b&gt;', api.esc('<b>') === '&lt;b&gt;');
check('highlight 无关键词时仍转义', api.highlight('<script>', '') === '&lt;script&gt;');
check('highlight 命中关键词包 <mark>', api.highlight('军训多久结束', '军训') === '<mark>军训</mark>多久结束');
check('daysUntil 返回数字', typeof api.daysUntil('2026-09-03') === 'number');
check('countdownText 返回非空字符串', typeof api.countdownText() === 'string' && api.countdownText().length > 0);
check('ALL_KEYS 共 23 项', api.ALL_KEYS.length === 23);

check('FAQ 匹配「军训要带什么」', (f => f && f.q.includes('军训要带什么'))(api.matchFaq('军训要带什么')));
check('FAQ 匹配「宿舍条件怎么样」', (f => f && f.q.includes('宿舍条件'))(api.matchFaq('宿舍条件怎么样')));
check('FAQ 匹配「假的新生群」', (f => f && f.q.includes('新生群'))(api.matchFaq('怎么识别假的新生群')));
check('FAQ 匹配「食堂」', (f => f && f.q.includes('食堂'))(api.matchFaq('食堂哪个好吃')));
check('FAQ 匹配「天气」', (f => f && f.q.includes('天气'))(api.matchFaq('今天天气如何')));

check('攻略匹配「抢课技巧」', (g => g && g.title.includes('抢课'))(api.matchGuide('抢课有什么技巧')));
check('攻略匹配「浴室/虹远楼」相关', (g => g && (g.title.includes('浴室') || g.title.includes('虹远楼')))(api.matchGuide('虹远楼浴室几点开')));
check('攻略匹配「快递与邮寄」', (g => g && g.title.includes('快递'))(api.matchGuide('把大件行李寄到学校怎么填地址')));
check('无关问题不硬答(null)', api.matchGuide('随机无意义内容xyz') === null);

const m = api.msgHTML('ai', '你好\n世界');
check('msgHTML 含复制按钮且换行转 <br>', m.includes('copy-btn') && m.includes('<br>'));

// ---- 校园地图 ----
check('MAP_LANDMARKS 有 5 组分组的标注', api.MAP_LANDMARKS.length === 5 && api.MAP_LANDMARKS.every(g => g.items.length > 0));
check('地标含 南门/诚信楼/博学楼/图书馆', ['南门', '诚信楼', '博学楼', '图书馆'].every(n => api.MAP_LANDMARKS.some(g => g.items.includes(n))));
check('地图文件存在且完整', (() => { try { const b = readFileSync(join(root, 'assets/uibe-campus-map.jpg')); return b.length > 100000 && b[b.length-2] === 0xFF && b[b.length-1] === 0xD9; } catch (e) { return false; } })());

// ---- 院系联系方式 ----
check('CONTACTS 覆盖 ≥18 个院系/部门', CONTACTS.length >= 18);
check('联系人搜索「金融」命中中国金融学院', (r => r.length > 0 && r.some(c => c.name.includes('金融')))(api.filterContacts('金融')));
check('联系人搜索空串返回全部', api.filterContacts('').length === CONTACTS.length);
check('联系人搜索无结果返回空数组', api.filterContacts('不存在的学院xyz').length === 0);
const sample = CONTACTS.find(c => c.phone !== '待补充' && c.email !== '待补充');
check('卡片含 tel: 与 mailto: 链接', !!sample && api.contactCardHTML(sample, '').includes('tel:') && api.contactCardHTML(sample, '').includes('mailto:'));
const pending = CONTACTS.find(c => c.phone === '待补充' || c.email === '待补充');
check('卡片对待补充字段显示占位', !!pending && api.contactCardHTML(pending, '').includes('待补充'));
check('卡片渲染转义防 XSS', !api.contactCardHTML({ name: '<b>x</b>', phone: '待补充', email: '待补充', location: '待补充', site: 'http://x/', source: 'http://x/' }, '').includes('<b>x</b>'));

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 || problems > 0 ? 1 : 0);
