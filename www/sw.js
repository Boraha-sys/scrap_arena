// 스크랩 아레나 오프라인 캐시. 게임을 업데이트하면 VERSION 숫자만 올리면 돼요 (sync-www.js가 자동으로 올림).
const VERSION = 'sa-1792161606830';
const FILES = ['./', './index.html', './manifest.json', './lib/three.min.js', './lib/GLTFLoader.js',
  './bgm/gar.js', './bgm/g1.js', './bgm/g2.js', './bgm/g3.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// 온라인이면 새 파일을 받고(받으면 캐시 갱신), 오프라인이면 캐시에서 실행
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && new URL(e.request.url).origin === location.origin) {
      const cp = r.clone(); caches.open(VERSION).then(c => c.put(e.request, cp));
    }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
