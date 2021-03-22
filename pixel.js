function DefinePixel(outObject, pixelEndpoint, redirect_urls) {
    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    var Config = {
        id: '',
        version: 1,
        appnexusUserId: null,
        messagingSenderId: '1061424448485',
    };

    var url = window.location.href;
    var params = new URL(url).searchParams;
    var click_id = params.get('clickid');

    outObject.process = function (subId, feed, callback) {
        // checkBrowser();
        sendWithToken(subId, feed, callback);
    };

    function isset(variable) {
        return typeof variable !== 'undefined' && variable !== null && variable !== '';
    }

    // function checkBrowser() {
    //     var isChrome = navigator.userAgent.indexOf('Chrome') !== -1;

    //     if (!isChrome) {
    //         redirect();
    //     }
    // }

    // function redirect() {
    //     if (typeof redirect_urls !== 'undefined' && redirect_urls && redirect_urls.length) {
    //         var random_index = Math.floor(Math.random() * redirect_urls.length);
    //         window.location.href = redirect_urls[random_index] + '?clickid=' + click_id;
    //     }
    // }

    function processEvent(currentToken, subId, feed, callback) {
        let pixel = new Pixel(currentToken, subId, feed, callback);
        pixel.send();
    }

    function sendWithToken(subId, feed, callback) {
        if (firebase.apps.length === 0) {
            firebase.initializeApp({
                messagingSenderId: Config.messagingSenderId,
            });
        }

        if ('Notification' in window) {
            var messaging = firebase.messaging();
            messaging
                .requestPermission()
                .then(function () {
                    messaging
                        .getToken()
                        .then(function (currentToken) {
                            if (currentToken) {
                                processEvent(currentToken, subId, feed, callback);
                                // window.location.href =
                                //     'https://c.adsco.re/d#QjMmAAAAAAAAylQdB848odJH2E18zfhElTToiF8,non,3,,AAIRaJAQ4zp1Ch0rQYfriOi3Up_2lMX13kTaGAEP_Ud0EGAQws4MKd1Ag_Noj9JpnUbLvgeaiaeonD2K5VC2gvmgyGBtrZiSKJwWIIsClY35xNfBf3bIlybfkloB0cA-MV4';
                                return;
                            } else {
                                console.warn('Не удалось получить токен.');
                            }
                        })
                        .catch(function (err) {
                            console.warn('При получении токена произошла ошибка.', err);
                        });
                })
                .catch(function (err) {
                    console.warn('Не удалось получить разрешение на показ уведомлений.', err);
                    // redirect();
                });
        }
    }

    class Pixel {
        constructor(currentToken, subId, feed, callback) {
            this.params = [];
            this.currentToken = currentToken;
            this.subId = subId || '1111';
            this.feed = feed;
            this.callback = callback;
            this.setUid();
            this.buildParams();
        }

        buildParams() {
            var attr = this.getAttribute();
            for (var index in attr) {
                if (attr.hasOwnProperty(index)) {
                    this.setParam(index, attr[index](index));
                }
            }
        }

        setParam(key, val) {
            if (isset(val)) {
                this.params.push(key + '=' + val);
            } else {
                if(key === 'callback'){
                    return
                }
                this.params.push(key + '=');
            }
        }

        setUid(remove) {
            if (remove) this.setCookie('uid', '', -100);
            else if (isset(this.getCookie('uid'))) {
                this.setCookie('uid', this.getCookie('uid'), 2 * 365 * 24 * 60);
            } else {
                this.setCookie('uid', guid(), 2 * 365 * 24 * 60);
            }
        }

        getAttribute() {
            let _this = this;
            return {
                uid: function uid() {
                    return _this.getCookie('uid');
                },
                dl: function dl() {
                    // return window.location.href;
                    return window.location.origin + window.location.pathname;
                },
                // document location
                qs: function qs() {
                    return window.location.search;
                },
                // query string
                rl: function rl() {
                    return document.referrer;
                },
                // referrer location
                subId: function subId() {
                    return _this.subId;
                },
                feed: function feed() {
                    return _this.feed;
                },
                callback: function callback() {
                    return _this.callback;
                },
                dt: function dt() {
                    return document.title;
                },
                ua: function ua() {
                    return window.navigator.userAgent;
                },
                token: function token() {
                    return _this.currentToken;
                },
            };
        }

        send() {
            window.navigator.sendBeacon ? this.sendBeacon() : this.sendImage();
        }

        sendBeacon() {
            window.navigator.sendBeacon(this.getSourceUrl());
        }

        sendImage() {
            this.img = document.createElement('img');
            this.img.src = this.getSourceUrl();
            this.img.style.display = 'none';
            this.img.width = '1';
            this.img.height = '1';
            document.getElementsByTagName('body')[0].appendChild(this.img);
        }

        getSourceUrl() {
            return pixelEndpoint + '?' + encodeURI(this.params.join('&'));
        }

        setCookie(name, v, minutes) {
            var expires = '';
            if (isset(minutes)) {
                var date = new Date();
                date.setTime(date.getTime() + minutes * 60 * 1000);
                expires = '; expires=' + date.toGMTString();
            }

            document.cookie = name + '=' + v + expires + '; path=/';
        }

        getCookie(name) {
            var name = name + '=';
            var ca = document.cookie.split(';');

            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1);
                if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
            }

            return;
        }
    }
}

function AdopPush(params) {
    if (window['activateBeacon']) return;
    let outObject = function () {
        outObject.process ? outObject.process.apply(outObject, arguments) : one.queue.push(arguments);
    };
    outObject.queue = [];
    outObject.t = 1 * new Date();
    window['activateBeacon'] = outObject;

    var fb = document.createElement('script'),
        fbm = document.createElement('script'),
        lcnt = 0;

    fb.async = fbm.async = false;
    fb.type = fbm.type = 'text/javascript';
    fb.src = 'https://www.gstatic.com/firebasejs/5.7.0/firebase-app.js';
    fbm.src = 'https://www.gstatic.com/firebasejs/5.7.0/firebase-messaging.js';
    fb.onload = fbm.onload = function () {
        lcnt++;
        if (lcnt === 2) {
            activateBeacon(params.subId, params.feed, params.callback)
        }
    };

    let head = document.getElementsByTagName('head')[0];
    head.appendChild(fb);
    head.appendChild(fbm);

    DefinePixel(outObject, 'https://dmp.findsale.club/dmp/api/1.0/token/save/', []);
}
