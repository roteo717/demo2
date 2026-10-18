/* 工場在庫管理 Service Worker
 * 方針：画面(HTML)は常にネットワーク優先。古い画面が表示され続けないようにする。
 *  - 在庫データは localStorage / サーバーDBにあり、ここではキャッシュしない
 *  - GET以外、別オリジン(Googleフォント等)、/api/ 系は一切関与しない
 *  - キャッシュするのは「オフライン時の表示用」のHTMLと、アイコン・manifestのみ
 *  - 更新時は CACHE_VERSION を変えると古いキャッシュを全削除する
 */
const CACHE_VERSION = 'inventory-pwa-v1';
const STATIC_ASSETS = [
  'manifest.json',
  'inventory-icon-192.png',
  'inventory-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((c) => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                       // 保存・入出庫などのPOST/PUT/DELETEは素通し
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // 外部(フォント等)は素通し
  if (url.pathname.startsWith('/api/')) return;           // APIは絶対にキャッシュしない
  if (url.pathname.endsWith('/sw.js')) return;

  // 画面(HTML)：ネットワーク優先。HTTPキャッシュも使わず常に最新を取得。失敗時のみキャッシュ。
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put('offline-page', copy));
          }
          return res;
        })
        .catch(() => caches.match('offline-page').then((r) => r || Response.error()))
    );
    return;
  }

  // アイコン・manifest：キャッシュ優先(内容が変わらない静的ファイルのみ)
  if (STATIC_ASSETS.some((a) => url.pathname.endsWith('/' + a))) {
    event.respondWith(caches.match(req).then((r) => r || fetch(req)));
  }
  // それ以外は何もしない(ブラウザ標準の動作)
});
