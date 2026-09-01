// ============================================================
// 贸大新生指南 · Service Worker (离线可用 + 资源缓存)
// 策略: 导航请求网络优先(保证更新及时), 静态资源缓存优先
// 改版时: 更新 CACHE 名(如 v19 → v20), 旧缓存自动清理
// ============================================================
const CACHE = 'uibe-guide-v24';

// 安装时预缓存应用外壳(数据文件带版本号, 改版即失效)
// 注意: 校园地图(329KB)不做预缓存, 用户首次打开 #/map 时由 fetch 处理器
//       按需缓存(缓存优先策略), 避免首访白下载大图 (P0 性能优化)
const ASSETS = [
  './',
  './index.html',
  './data-guides.js?v=24',
  './data-faq.js?v=24',
  './data-contacts.js?v=24',
  './data-wechat.js?v=24',
  './data-sites.js?v=24',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/uibe-logo.png',
  './assets/fonts/uibe-kaiti.woff2',
  './share.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 只处理同源请求

  // 页面导航: 网络优先, 断网时回退缓存
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match('./index.html'))
        )
    );
    return;
  }

  // 静态资源: 缓存优先, 未命中再请求并写入缓存
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
