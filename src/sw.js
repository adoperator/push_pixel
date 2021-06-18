var KEYS = {
  BET: 'lastBet',
  SHOW: 'lastShow',
  CLICK: 'lastClick'
}

var IDB = (function (n) {
  'use strict'

  function t(n) {
    return new Promise(function (t, r) {
      ;(n.oncomplete = n.onsuccess =
        function () {
          return t(n.result)
        }),
        (n.onabort = n.onerror =
          function () {
            return r(n.error)
          })
    })
  }

  function r(n, r) {
    var e = indexedDB.open(n)
    e.onupgradeneeded = function () {
      var b = e.result
      if (!b.objectStoreNames.contains(r)) {
        var c = b.createObjectStore(r)
        return c.add(0, KEYS.BET), c.add(0, KEYS.SHOW), c.add(0, KEYS.CLICK), c
      }
    }
    var u = t(e)
    return function (n, t) {
      return u.then(function (e) {
        return t(e.transaction(r, n).objectStore(r))
      })
    }
  }
  var e

  function u() {
    return e || (e = r('resources', 'push')), e
  }

  function o(n, r) {
    return n('readonly', function (n) {
      return (
        (n.openCursor().onsuccess = function () {
          this.result && (r(this.result), this.result.continue())
        }),
        t(n.transaction)
      )
    })
  }
  return (
    (n.get = function (n) {
      var r = u()
      return r('readonly', function (r) {
        return t(r.get(n))
      })
    }),
    (n.set = function (n, r) {
      var e = u()
      return e('readwrite', function (e) {
        return e.put(r, n), t(e.transaction)
      })
    }),
    n
  )
})({})

var DEFAULT_CONFIG = {
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

        IDB.set(KEYS.CLICK, Date.now())

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

async function canBidRequest_() {
  const randomVersion = Math.random()
  const response = await fetch(
    'https://cdn.jsdelivr.net/gh/adoperator/push_pixel@latest/dist/config.json?v=' +
      randomVersion
  )

  if (response.ok) {
    DEFAULT_CONFIG = await response.json()
  }

  const storeLastBet = parseInt(await IDB.get(KEYS.BET)) || 0

  if (!storeLastBet) {
    IDB.set(KEYS.BET, 0)
  }

  return Date.now() - storeLastBet > DEFAULT_CONFIG.frequencyOfBet * 1000
}

async function onPush_(event) {
  const canBidRequest = await canBidRequest_()

  if (!canBidRequest) {
    return defaultPush_()
  }
  const push = event.data.json()
  const notification = push.notification || {}

  if (!notification.body) return defaultPush_()

  const ua = navigator.userAgent
  const link = notification.body.replace('%user_agent%', ua)
  const response = await fetch(link)

  IDB.set(KEYS.BET, Date.now())

  if (!response.ok) return defaultPush_()

  const notifications = await response.json()

  if (!notifications.length) return defaultPush_()

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
    IDB.set(KEYS.SHOW, Date.now())
  })
}
