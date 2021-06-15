function onInstall(e) {
  console.log('onInstall', e)
}

function onActivate(e) {
  console.log('onActivate', e)
}

function onFetch(e) {
  console.log('onFetch', e)
}

function onPush(e) {
  self.registration.showNotification('test3', {
    body: 'test3'
  })
  e.waitUntil(console.log('onPush Test version 2', e))
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
