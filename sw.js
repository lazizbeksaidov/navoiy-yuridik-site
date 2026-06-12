// Minimal service worker — ilova qobig'ini keshlaydi (asosiy fayllar)
const C = 'navoiy-v31';
const ASSETS = ['./', './index.html', './css/style.css?v=31', './js/app.js?v=31',
  './js/auth-config.js?v=31', './js/supabase.min.js', './js/qrcode.min.js',
  './js/motion.min.js', './img/logo.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache:'reload'})).filter(Boolean)).catch(()=>{})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Supabase / Gemini so'rovlari — har doim tarmoqdan (keshlanmaydi)
  if (u.hostname.includes('supabase') || u.hostname.includes('google')) return;
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const cp = resp.clone();
      caches.open(C).then(c => c.put(e.request, cp)).catch(()=>{});
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
