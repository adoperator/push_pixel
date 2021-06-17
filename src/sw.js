var KEYS = {
  BET: 'lastBet',
  SHOW: 'lastShow',
  CLICK: 'lastClick'
}

var idb=function(d){'use strict';function h(d){return new Promise(function(a,b){d.oncomplete=d.onsuccess=function(){return a(d.result)},d.onabort=d.onerror=function(){return b(d.error)}})}function a(b,f){var a=indexedDB.open(b);a.onupgradeneeded=function(){var b=a.result;if(!b.objectStoreNames.contains(f)){var c=b.createObjectStore(f);return c.add(0,KEYS.BET),c.add(0,KEYS.SHOW),c.add(0,KEYS.CLICK),c}};var c=h(a);return function(a,b){return c.then(function(d){return b(d.transaction(f,a).objectStore(f))})}}function f(){return b||(b=a("resources","push")),b}var b;return d.createStore=a,d.get=function(b){return f("readonly",function(c){return h(c.get(b))})},d.promisifyRequest=h,d.set=function(d,a){return f("readwrite",function(b){return b.put(a,d),h(b.transaction)})},d}({});

var DEFAULT_CONFIG = {
  frequencyOfNotifications: 28800,
  intervalOfNotifications: {
    from: 8,
    to: 22
  },
  frequencyOfBet: 1200, // 60 * 60
  defaultPush: [
    {
      title: '',
      body: ''
    }
  ]
}

self.addEventListener('push', event => {
  event.waitUntil(onPush_(event))
})

self.addEventListener('notificationclick', function (event) {
  const target = event.notification.data.click_action || '/'
  event.notification.close()

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true
      })
      .then(function (clientList) {
        // clientList always is empty?!
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i]
          if (client.url === target && 'focus' in client) {
            return client.focus()
          }
        }

        idb.set(KEYS.CLICK, Date.now())

        return clients.openWindow(target)
      })
  )
})

function getDefaultPush_() {
  return DEFAULT_CONFIG.defaultPush[
    Math.floor(Math.random() * DEFAULT_CONFIG.defaultPush.length)
  ]
}

function defaultPush_() {
  const push = getDefaultPush_()
  return self.registration.showNotification(push.title, push)
}

async function canShowNotification_() {
  const response = await fetch(
    'https://cdn.jsdelivr.net/gh/adoperator/push_pixel@latest/dist/config.json'
  )

  if (response.ok) {
    DEFAULT_CONFIG = await response.json()
  }

  const config = DEFAULT_CONFIG
  const storeLastShow = await idb.get(KEYS.SHOW)
  const storeLastBet = await idb.get(KEYS.BET)

  if (Date.now() - storeLastBet < config.frequencyOfBet * 1000) {
    return false
  }

  const date = new Date(Date.now())
  const hs = date.getHours()

  const canShowByWorkTime =
    hs >= config.intervalOfNotifications.from &&
    hs <= config.intervalOfNotifications.to
  const canShowByLastShow =
    Date.now() - storeLastShow > config.frequencyOfNotifications * 1000

  return canShowByWorkTime && canShowByLastShow
}

async function onPush_(event) {
  const canShowNotification = await canShowNotification_()
  if (!canShowNotification) {
    return defaultPush_()
  }
  const push = event.data.json()
  const notification = push.notification || {}

  if (!notification.body) return defaultPush_()

  const ua = navigator.userAgent
  const link = notification.body.replace('%user_agent%', ua)
  const response = await fetch(link)

  if (!response.ok) return defaultPush_()

  const notifications = await response.json()

  if (!notifications.length) return defaultPush_()

  idb.set(KEYS.BET, Date.now())

  await sendPush_(notifications)
}

async function sendPush_(notifications) {
  notifications.forEach(async notification => {
    await self.registration.showNotification(notification.title, {
      body: notification.text,
      icon: notification.icon_url,
      image: notification.image_url,
      data: {
        click_action: notification.click_url
      }
    })
    idb.set(KEYS.SHOW, Date.now())
  })
}
