var DEFAULT_CONFIG = {
  minBid: 0.0001,
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

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const data = event.notification.data
  const target =
    event.action in data ? data[event.action] : data.click_action || '/'

  event.waitUntil(clients.openWindow(target))
})

function getDefaultPush_() {
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

function defaultPush_() {
  const push = getDefaultPush_()
  return self.registration.showNotification(push.title, push)
}

async function loadConfig_() {
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

async function onPush_(event) {
  await loadConfig_()

  let push

  try {
    push = event.data.json()
  } catch (error) {
    console.error(error)
    return defaultPush_()
  }

  const notification = push.notification || {}

  if (!notification.body) return defaultPush_()

  const ua = navigator.userAgent
  const link = notification.body.replace('%user_agent%', ua)

  let response

  try {
    response = await fetch(link)
  } catch (error) {
    console.error(error)
    return defaultPush_()
  }

  if (!response.ok) return defaultPush_()

  const notifications = await response.json()

  if (!notifications.length) return defaultPush_()

  return await sendPush_(notifications)
}

async function sendPush_(notifications) {
  const minBid = DEFAULT_CONFIG.minBid

  return notifications.forEach(async notification => {
    if (notification.cpc < minBid) return defaultPush_()

    const options = {
      vibrate: notification.vibrate || [300, 100, 400],
      requireInteraction: true,
      actions: notification.actions || [
        { action: 'action1', title: 'Watch Later' },
        { action: 'action2', title: 'Options' }
      ],
      body: notification.text,
      icon: notification.icon_url,
      image: notification.image_url,
      data: {
        click_action: notification.click_url,
        action1: notification.action1 || notification.click_url,
        action2: notification.action2 || notification.click_url
      }
    }

    if (notification.image_url) {
      options.image = notification.image_url
    }

    return await self.registration.showNotification(notification.title, options)
  })
}
