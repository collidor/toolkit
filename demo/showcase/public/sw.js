// ============================================================================
// Collidor Showcase — Cache-First Service Worker for PokéAPI & Sprite CDN
// Ensures 100% protection against overwhelming public PokéAPI endpoints
// ============================================================================

const CACHE_NAME = 'collidor-pokeapi-cache-v1';
const POKEAPI_PREFIX = 'https://pokeapi.co/api/v2/';
const GITHUB_SPRITES_PREFIX = 'raw.githubusercontent.com/PokeAPI/sprites';

self.addEventListener('install', (event) => {
  // Activate worker immediately without waiting
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Claim all clients immediately so requests are intercepted from first load
      await self.clients.claim();

      // Clean up outdated caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Intercept PokéAPI requests and Sprite CDN assets
  const isPokeApi = url.startsWith(POKEAPI_PREFIX);
  const isSprite = url.includes(GITHUB_SPRITES_PREFIX);

  if (!isPokeApi && !isSprite) {
    return; // Pass through standard app assets
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);

      if (cachedResponse) {
        // Cache Hit: Serve instantly from browser CacheStorage, 0 requests to PokéAPI
        return cachedResponse;
      }

      // Cache Miss: Fetch once and cache response permanently
      try {
        const networkResponse = await fetch(event.request);
        if (
          networkResponse &&
          (networkResponse.status === 200 || networkResponse.type === 'opaque')
        ) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        // Network failure / Offline fallback
        return (
          cachedResponse ||
          new Response(
            JSON.stringify({ error: 'PokéAPI request failed offline' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        );
      }
    })()
  );
});
