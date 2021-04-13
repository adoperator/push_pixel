export default class AdopPush {
  constructor(params) {
    this.subId = params.subId || 'test'
    this.feed = params.feed || null
    this.callback = params.callback || null
    this.intermediateRedirect = params.intermediateRedirect || null
    this.finalRedirect = params.finalRedirect || null
    this.cookieDomain = params.cookieDomain || null

    this.init()
  }

  init() {
    if (window['activateBeacon']) return

    const initProcess = function () {
      initProcess['process'] ? initProcess['process'].apply(initProcess, arguments) : initProcess.queue.push(arguments)
    }
    initProcess.queue = []
    initProcess.t = Date.now()
    window['activateBeacon'] = initProcess

    this.loadScripts(this.subId, this.feed, this.callback, this.intermediateRedirect, this.finalRedirect, this.cookieDomain)
    this.definePixel(initProcess, 'https://dmp.findsale.club/dmp/api/1.0/token/save/')
  }

  loadScripts(subId, feed, callback, intermediateRedirect, finalRedirect, cookieDomain) {
    let count = 0
    const fb = document.createElement('script')
    const fbm = document.createElement('script')
    fb.async = fbm.async = false
    fb.type = fbm.type = 'text/javascript'
    fb.src = 'https://www.gstatic.com/firebasejs/5.7.0/firebase-app.js'
    fbm.src = 'https://www.gstatic.com/firebasejs/5.7.0/firebase-messaging.js'
    document.head.appendChild(fb)
    document.head.appendChild(fbm)
    fb.onload = fbm.onload = function () {
      count++
      if (count === 2) {
        activateBeacon(subId, feed, callback, intermediateRedirect, finalRedirect, cookieDomain)
      }
    }
  }

  definePixel(initProcess, endpoint) {
    const Config = {
      id: '',
      version: 1,
      appnexusUserId: null,
      messagingSenderId: '1061424448485'
    }

    function processEvent(token, subId, feed, callback) {
      let pixel = new _Pixel(token, subId, feed, callback)
      pixel.send(endpoint)
    }

    initProcess.process = (subid, feed, callback, ir, fr, domain) => {
      ir = ir || null
      fr = fr || null
      domain = domain || null

      this.sendWithToken(subid, feed, callback, ir, fr, domain, processEvent, Config)
    }
  }

  sendWithToken(subId, feed, callback, ir, fr, domain, processEvent, Config) {
    if (firebase.apps.length === 0) {
      firebase.initializeApp({
        messagingSenderId: Config.messagingSenderId
      })
    }

    if ('Notification' in window) {
      if (_Utils.getCookie('subscribe') === 'true') {
        if (fr) window.location.href = fr
        return
      }

      const messaging = firebase.messaging()
      navigator.serviceWorker.register('./sw.js').then(
        reg => {
          messaging.useServiceWorker(reg)
          const expiresDate = new Date(Date.now() + 30 * 86400e3).toUTCString()
          messaging.requestPermission()
            .then(() => {
              messaging.getToken()
                .then(token => {
                  if (token) {
                    processEvent(token, subId, feed, callback)
                    if (domain) document.cookie = `subscribe=true;domain=${domain};secure=true;expires=${expiresDate}`
                    if (fr) window.location.href = fr
                  } else {
                    console.warn('Не удалось получить токен.')
                    if (domain) document.cookie = `subscribe=false;domain=${domain};secure=true;expires=${date}`
                    if (ir) window.location.href = ir
                  }
                })
                .catch(function (err) {
                  console.warn('При получении токена произошла ошибка.', err)
                  if (domain) document.cookie = `subscribe=false;domain=${domain};secure=true;expires=${date}`
                  if (ir) window.location.href = ir
                })
            })
            .catch(err => {
                console.warn('Не удалось получить разрешение на показ уведомлений.', err)
                if (domain) document.cookie = `subscribe=false;domain=${domain};secure=true;expires=${expiresDate}`
                if (ir) window.location.href = ir
              }
            )
        }
      )
    }
  }
}

const _Utils = {
  guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  },
  isSet(value) {
    return typeof value !== 'undefined' && value !== null && value !== ''
  },
  setCookie(name, v, minutes) {
    let expires = ''
    if (this.isSet(minutes)) {
      let date = new Date()
      date.setTime(date.getTime() + minutes * 60 * 1000)
      expires = '; expires=' + date.toGMTString()
    }
    document.cookie = name + '=' + v + expires + '; path=/'
  },
  getCookie(name) {
    let matches = document.cookie.match(new RegExp(
      '(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'
    ))
    return matches ? decodeURIComponent(matches[1]) : undefined
  }
}

class _Pixel {
  constructor(token, subId, feed, callback) {
    this._params = []
    this._token = token
    this._subId = subId
    this._feed = feed
    this._callback = callback

    this.setUid()
    this.buildParams()
  }

  send(pixelEndpoint) {
    window.navigator.sendBeacon ? this.sendBeacon(pixelEndpoint) : this.sendImage(pixelEndpoint)
  }

  sendBeacon(pixelEndpoint) {
    window.navigator.sendBeacon(this.getSourceUrl(pixelEndpoint));
  }

  sendImage(pixelEndpoint) {
    const image = document.createElement('img')
    image.src = this.getSourceUrl(pixelEndpoint)
    image.style.display = 'none'
    image.width = 1
    image.height = 1
    document.getElementsByTagName('body')[0].appendChild(image)
  }

  getSourceUrl(pixelEndpoint) {
    return pixelEndpoint + '?' + encodeURI(this._params.join('&'));
  }

  buildParams() {
    const attrs = this.getAttributes()
    for (let index in attrs) {
      if (attrs.hasOwnProperty(index)) {
        this.setParam(index, attrs[index]())
      }
    }
  }

  setParam(key, value) {
    if (_Utils.isSet(value)) {
      this._params.push(`${key}=${value}`)
    } else {
      if (key === 'callback') {
        return
      }
      this._params.push(key + '=')
    }
  }

  setUid(remove = false) {
    if (remove) _Utils.setCookie('uid', '', -100)
    else if (_Utils.isSet(_Utils.getCookie('uid'))) {
      _Utils.setCookie('uid', _Utils.getCookie('uid'), 2 * 365 * 24 * 60)
    } else {
      _Utils.setCookie('uid', _Utils.guid(), 2 * 365 * 24 * 60)
    }
  }

  getAttributes() {
    return {
      uid() {
        return _Utils.getCookie('uid')
      },
      dl() {
        return window.location.origin + window.location.pathname
      },
      qs() {
        return window.location.search
      },
      rl() {
        return document.referrer
      },
      subId: () => {
        return this._subId
      },
      feed: () => {
        return this._feed
      },
      callback: () => {
        return this._callback
      },
      dt() {
        return document.title
      },
      ua() {
        return window.navigator.userAgent
      },
      token: () => {
        return this._token
      }
    }
  }
}
