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
