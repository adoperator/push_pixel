 firebase.initializeApp({
    messagingSenderId: '502652469453'
});

// браузер поддерживает уведомления
if ('Notification' in window) {
    var messaging = firebase.messaging();

    // пользователь уже разрешил получение уведомлений
    // подписываем на уведомления если ещё не подписали
    if (Notification.permission === 'granted') {
        subscribe();
    }

    subscribe();
}

function subscribe() {
    // запрашиваем разрешение на получение уведомлений
    messaging.requestPermission()
        .then(function () {
            // получаем ID устройства
            messaging.getToken()
                .then(function (currentToken) {
                    //console.log(currentToken);

                    if (currentToken) {
                        sendTokenToServer(currentToken);
                    } else {
                        console.warn('Не удалось получить токен.');
                        setTokenSentToServer(false);
                    }
                })
                .catch(function (err) {
                    console.warn('При получении токена произошла ошибка.', err);
                    setTokenSentToServer(false);
                });
        })
        .catch(function (err) {
            console.warn('Не удалось получить разрешение на показ уведомлений.', err);
        });
}

// отправка ID на сервер
function sendTokenToServer(currentToken) {
    if (!isTokenSentToServer(currentToken)) {
        console.log('Отправка токена на сервер...');

        var url = 'https://api.causatrk42.com/dmp/api/1.0/token/save'; // адрес скрипта на сервере который сохраняет ID устройства
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({"token": currentToken,
                "data": {
                    "userAgent": navigator.userAgent,
                    "lang": navigator.language
                }
            }),
            success: function (data) {
                console.log(data);
            },
            error: function (xhr) {
                console.log(xhr.responseText);
            }
        });

        setTokenSentToServer(currentToken);
    } else {
        //console.log(currentToken);
        console.log('Токен уже отправлен на сервер.');
    }
}

// используем localStorage для отметки того,
// что пользователь уже подписался на уведомления
function isTokenSentToServer(currentToken) {
    return window.localStorage.getItem('sentFirebaseMessagingToken') == currentToken;
}

function setTokenSentToServer(currentToken) {
    window.localStorage.setItem(
        'sentFirebaseMessagingToken',
        currentToken ? currentToken : ''
    );
}
