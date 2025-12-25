const CACHE_NAME = 'image-cache-v1';
const IMAGE_URLS = [
        "/images/67.png",
        "/images/Alchemy Lab.png",
        "/images/cookie.png",
        "/images/Demonic Allegations.png",
        "/images/Dubai Chocolate.png",
        "/images/Factory.png",
        "/images/Farm.png",
        "/images/Find out about 41.png",
        "/images/Grandma.png",
        "/images/Ice Cream Haircut.png",
        "/images/Labubu.png",
        "/images/Mango.png",
        "/images/Mason Name Change.png",
        "/images/Mine.png",
        "/images/Portal.png",
        "/images/Shipment.png",
        "/images/Time Machine.png",
        "/images/Word of the year.png",
        "/images/Auto Clicker.png",
        "/images/Alchemy Lab Multiplier.png",
        "/images/Factory Multiplier.png",
        "/images/Farm Multiplier.png",
        "/images/Grandma Multiplier.png",
        "/images/Mine Multiplier.png",
        "/images/Portal Multiplier.png",
        "/images/Shipment Multiplier.png",
        "/images/Time Machine Multiplier.png"
      ];

const ENCODED_URLS = IMAGE_URLS.map(url => encodeURI(url));

self.addEventListener('install', (event) => {
  console.log('Service Worker installing and caching images.');
  self.skipWaiting(); // activate worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ENCODED_URLS); 
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })  //this bracket syntax is ugly lol
  );
  self.clients.claim(); // need update asap
});

self.addEventListener("fetch", (event) => {
  if (event.request.destination === 'image') {
    return; //so that the SW will only handle image requests and doesnt do calculations for invalid requests
  }
  console.log('fetch in progress')
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          console.log('returning cached image:', event.request.url);
          return cached;
        }
        // No cached response, try network
        return fetch(event.request)
          .then(networkResponse => {
            console.log('fetched from network:', event.request.url);
            return networkResponse;
          })
          .catch(() => { // avoid the exception by at least returning null
            return null;
          });
      })
      .catch(err => {
        console.error('Error in fetch handler:', err);
        return null;
      })
  );
})