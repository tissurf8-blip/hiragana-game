/* ================================================
   ひらがなゲーム！ Service Worker
   ================================================ */

const CACHE_NAME = 'hiragana-game-v2'; // 書くモード追加でバージョンアップ

const PRECACHE_URLS = [
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './char_normal.jpg',
  './char_thinking.jpg',
  './char_happy.jpg',
  './char_fever.jpg',
  './bgm.mp3',
];

// インストール：キャッシュに登録
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // bgm.mp3 や画像は存在しない場合もあるので個別に試みる
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(() => {
            // ファイルが存在しない場合はスキップ
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// アクティベート：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// フェッチ：キャッシュファースト
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // 有効なレスポンスのみキャッシュ
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        // オフライン時はキャッシュ済み index.html を返す
        return caches.match('./index.html');
      });
    })
  );
});
