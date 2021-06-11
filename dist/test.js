function onInstall(e) {
  console.log('onInstall', e)
  e.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll(['https://cdn.jsdelivr.net/gh/adoperator/push_pixel@0.1.3/dist/test.js'])
    })
  )
}

function onActivate(e) {
  console.log('onActivate1', e)
}

function onFetch(e) {
  console.log('onFetch', e)
  e.respondWith(caches.match(e.request))
}

function onPush(e) {
  e.waitUntil(console.log('onPush', e))
}

function onSync(e) {
  console.log('onSync', e)
}

function onNotificationClick(e) {
  console.log('onNotificationClick', e)
}

function onMessage(e) {
  console.log('onMessage', e)
}
