var DEFAULT_CONFIG = {
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
  const target = event.notification.data.click_action || '/'

  event.waitUntil(clients.openWindow(target))
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

async function loadConfig_() {
  const randomVersion = Math.random()
  const response = await fetch(
    'https://cdn.jsdelivr.net/gh/adoperator/push_pixel@latest/dist/config.json?v=' +
      randomVersion
  )

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
    return defaultPush_()
  }

  const notification = push.notification || {}

  if (!notification.body) return defaultPush_()

  const ua = navigator.userAgent
  const link = notification.body.replace('%user_agent%', ua)
  const response = await fetch(link)

  if (!response.ok) return defaultPush_()

  const notifications = await response.json()

  if (!notifications.length) return defaultPush_()

  return await sendPush_(notifications)
}

async function sendPush_(notifications) {
  return notifications.forEach(async notification => {
    await self.registration.showNotification(notification.title, {
      body: notification.text,
      icon: notification.icon_url,
      image: notification.image_url,
      data: {
        click_action: notification.click_url
      }
    })
  })
}
