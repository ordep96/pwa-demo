const CACHE_NAME = 'pwa-demo'
const urlsToCache = [
  './',
  './?utm=homescreen',
  './index.html',
  './style.css',
  './script.js',
  './sw.js'
]

self.addEventListener('install', e => {
  console.log('Evento: SW instaled')
  // vamos a empezar a registrar el cache
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Archivos en cache', cache)
        return cache.addAll(urlsToCache)
          .then(() => self.skipWaiting())
          // skipWaiting forza al SW a activarse
      })
     .catch(err => console.log('Failed cache register', err))
  )
})

self.addEventListener('activate', e => {
  console.log('Evento: Sw Activated')
  const cacheList = [CACHE_NAME]

  e.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // eliminamos lo que ya no necesitamos en cache
            if ( cacheList.indexOf(cacheName) === -1 ) {
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Cache updated')
        // Activa los elementos actuales y que este a la espera de nuevos cambios
        return self.clients.claim()
      })
      .catch(err => console.log(err))
  )
})

self.addEventListener('fetch', e => {
  console.log('Event: Sw Fetched')
  e.respondWith(
    caches.match(e.request)
      .then( res => {
        if ( res ) {
          return res
        }

        return fetch( e.request )
          .then(res => {
            let resToCache = res.clone()

            caches.open(CACHE_NAME)
              .then(cache => {
                cache
                  .put(e.request, resToCache)
                  .catch(err => console.log(request.url, err.message))
              })

            return res
          })
      })
  )
})

// PUSH
self.addEventListener('push', e => {
  console.log('Event Push')
  let titleNotification = 'Push Notification'
  let options = {
    body: 'Quieres ver la pagina de Koombea ?',
    icon: './img/icon_192x192.png',
    vibrate: [100,50,100],
    data: {
      id: 03464
    },
    actions: [
      { 'action': true, 'title': 'Aceptar :)', icon: './img/icon_192x192.png'},
      { 'action': false, 'title': 'Decline :(', icon: './img/icon_192x192.png'}
    ]
  }
  e.waitUntil( self.registration.showNotification(titleNotification, options))
})

self.addEventListener('notificationclick', e => {
  if ( e.action ) {
    console.log('Redireccionando a la pagina de koombea ')
    clients.openWindow('https://koombea.com', '_blank')
  } else {
    console.log('Hey barro con el viejo fabi')
  }
  e.notification.close()
})

self.addEventListener('sync', e => {
  console.log('Event: Background Sync', e)

  if ( e.tag === 'github' || e.tag === 'test-tag-from-devtools' ) {
    e.waitUntil(
      // comprobar las pesteñas abiertas
      self.clients.matchAll()
        .then(all => {
          return all.map(client => {
            return client.postMessage('online')
          })
        })
        .catch(err => console.log(err))
    )
  }
})
