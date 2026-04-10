importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
  console.log('Workbox loaded successfully');

  workbox.core.setCacheNameDetails({
    prefix: 'SupportHR-PWA-cache',
    suffix: 'v1'
  });

  workbox.precaching.precacheAndRoute([
    { url: '/pwa/offline.html', revision: '1' }
  ]);

  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style' || 
                     request.destination === 'script' || 
                     request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: 'SupportHR-PWA-cache-assets',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60
        })
      ]
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'SupportHR-PWA-cache-images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 24 * 60 * 60
        })
      ]
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'SupportHR-PWA-cache-pages',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60
        })
      ]
    })
  );

  workbox.routing.setCatchHandler(({ event }) => {
    if (event.request.mode === 'navigate') {
      return caches.match('/pwa/offline.html');
    }
    return Response.error();
  });

} else {
  console.log('Workbox failed to load');
}
