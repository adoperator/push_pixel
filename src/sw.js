var DEFAULT_CONFIG = {
  minBid: 0.0001,
  defaultPush: [
    {
      title: '',
      body: ''
    }
  ]
}

self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('push', event => {
  event.waitUntil(onPush(event))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const data = event.notification.data || {}
  const target =
    event.action in data ? data[event.action] : data.click_action || '/'

  event.waitUntil(clients.openWindow(target))
})

self.addEventListener('pushsubscriptionchange', event => {
  console.log("[Service Worker]: 'pushsubscriptionchange' event")
})

function getdefaultPush() {
  const push =
    DEFAULT_CONFIG.defaultPush[
      Math.floor(Math.random() * DEFAULT_CONFIG.defaultPush.length)
    ]
  return Object.assign(push, {
    vibrate: push.vibrate || [300, 100, 400],
    requireInteraction: true,
    actions: push.actions || [
      { action: 'action1', title: 'Watch Later' },
      { action: 'action2', title: 'Options' }
    ],
    data: {
      action1: push.data.action1 || push.data.click_action,
      action2: push.data.action2 || push.data.click_action
    }
  })
}

function defaultPush() {
  const push = getdefaultPush()
  return self.registration.showNotification(push.title, push)
}

async function loadConfig() {
  const randomVersion = Math.random()
  let response

  try {
    response = await fetch(
      'https://cdn.jsdelivr.net/gh/adoperator/push_pixel@latest/dist/config.json?v=' +
        randomVersion
    )
  } catch (error) {
    console.error(error)
    return
  }

  if (response.ok) {
    DEFAULT_CONFIG = await response.json()
  }
}

async function onPush(event) {
  await loadConfig()

  let push

  try {
    push = event.data.json()
  } catch (error) {
    console.error(error)
    return defaultPush()
  }

  const notification = push.notification || {}

  if (!notification.body) return defaultPush()

  const ua = navigator.userAgent
  const link = notification.body.replace('%user_agent%', ua)

  let response

  try {
    response = await fetch(link)
  } catch (error) {
    console.error(error)
    return defaultPush()
  }

  if (!response.ok) return defaultPush()

  let notifications

  try {
    notifications = await response.json()
  } catch (error) {
    console.error(error)
    return defaultPush()
  }

  if (!notifications.length) return defaultPush()

  const promises = []

  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i]

    if (notification.cpc < DEFAULT_CONFIG.minBid) return defaultPush()

    const options = {
      vibrate: notification.vibrate || [300, 100, 400],
      requireInteraction: true,
      actions: notification.actions || [
        { action: 'action1', title: 'Watch Later' },
        { action: 'action2', title: 'Options' }
      ],
      body: notification.text,
      icon: notification.icon_url,
      data: {
        click_action: notification.click_url,
        action1: notification.action1 || notification.click_url,
        action2: notification.action2 || notification.click_url
      }
    }

    if (notification.image_url) {
      options.image = notification.image_url
    }

    promises.push(
      self.registration.showNotification(notification.title, options)
    )
  }
  return Promise.all(promises)
}
