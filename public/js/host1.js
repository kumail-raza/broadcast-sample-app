(function () {
    var broadcast = {status: 'waiting', streams: 1};
    let broadcastHandler;

    /**
     * Get our OpenTok API Key, Session ID, and Token from the JSON embedded
     * in the HTML.
     */
    var getCredentials = function () {
        var el = document.getElementById('credentials');
        var credentials = JSON.parse(el.getAttribute('data'));
        el.remove();
        return credentials;
    };

    /**
     * Set the state of the broadcast and update the UI
     */
    var updateStatus = function (status) {
        var startStopButton = document.getElementById('startStop');
        broadcast.status = status;
        if (status === 'active') {
            document.getElementById('broadcastStatus').classList.remove('btn-danger')
            document.getElementById('broadcastStatus').classList.add('btn-success')
            startStopButton.classList.add('active');
            startStopButton.innerHTML = 'End Broadcast';
        } else {
            document.getElementById('broadcastStatus').classList.add('btn-danger')
            document.getElementById('broadcastStatus').classList.remove('btn-success')

            startStopButton.classList.disabled = true;
            startStopButton.innerHTML = 'Broadcast Over';
            startStopButton.disabled = true;
        }
    }

    var attachDOMEvents = function (vvOT) {

        document.querySelector('select[name=videoSource]').addEventListener('change', function (ev) {
            vvOT.unpublishStream();
            const videoSourceOption = document.querySelector('select[name=videoSource]');
            const selectedOption = videoSourceOption.options[videoSourceOption.selectedIndex].value;
            const mySearchParams = new URLSearchParams(location.search);
            const properties = {
                container: 'hostDivider',
                name: mySearchParams.get('name') || 'Host',
                insertMode: 'before',
            };
            if (selectedOption === 'screen') {
                properties.videoSource = 'screen';
            }
            vvOT.publishOwnStreams(properties);
        })
    }

    var sendBroadcastStatusToClient = (conversationId, type, status) => {
        var settings = {
            "url": "https://dev-pc.voicevoice.com/cmserver/api/initiateBroadcast",
            "method": "POST",
            "timeout": 0,
            "headers": {
                "Content-Type": "application/json"
            },
            "data": JSON.stringify({"conversationId": conversationId, "type": type, "status": status}),
            "success": (res) => console.log(res)
        };

        $.ajax(settings).done(function (response) {
            console.log(response);
        });
    }

    var connectDisconnectParticipant = function (userId, status) {
        var settings = {
            "url": "https://dev-pc.voicevoice.com/cmserver/api/inviteParticipateInBroadcast",
            "method": "POST",
            "timeout": 0,
            "headers": {
                "Content-Type": "application/json"
            },
            "data": JSON.stringify({"userId": userId, "status": status}),
            "success": (res) => console.log(res)
        };

        $.ajax(settings).done(function (response) {
            console.log(response);
        });
    }

    var init = function () {
        const credentials = getCredentials();
        const props = {connectionEventsSuppressed: true};
        const vvOT = new vvOpenTok();
        const icHandler = new IOpenTok();
        icHandler.onConnect = function (error) {
            if (error) {
                console.log(error);
            } else {
                localStorage.removeItem('tab-count');
                const mySearchParams = new URLSearchParams(location.search);
                const properties = {
                    container: 'hostDivider',
                    name: mySearchParams.get('name') || 'Host',
                    insertMode: 'before',
                };
                vvOT.publishOwnStreams(properties);
                vvOT.subcribesToStreams('hostDivider');
                vvOT.registerEvents(icHandler);

                window.mC = vvOT.getControls();

                attachDOMEvents(vvOT);

                document.getElementById('startStop').disabled = false;
            }
        };
        icHandler.onStreamCreated = function (event) {
            broadcast.streams++;
            localStorage.setItem('tab-count', broadcast.streams);
        }
        icHandler.onStreamDestroyed = function () {
            broadcast.streams--;
            localStorage.setItem('tab-count', broadcast.streams);
        }
        icHandler.onBroadcastStart = function () {
            updateStatus('active')
        }
        icHandler.onBroadcastEnd = function () {
            updateStatus('ended')
        }
        vvOT.connect(props, credentials);

        var startStopButton = document.getElementById('startStop');
        startStopButton.addEventListener('click', function () {
            if (!broadcastHandler) {
                broadcastHandler = vvOT.enableBroadcast();
            }
            if (broadcast.status === 'waiting') {
                sendBroadcastStatusToClient(15, 'reservationLess', '1')
                broadcastHandler.startBroadcast();
            } else if (broadcast.status === 'active') {
                sendBroadcastStatusToClient(15, 'reservationLess', '0')
                broadcastHandler.endBroadcast();
            }
        });

        document.getElementById('inviteParticipant').addEventListener('click', function () {
            if (broadcast.streams > 3) {
                alert('max 4 can be host at a time')
                return;
            }
            const userId = document.getElementById('userId').value;
            connectDisconnectParticipant(userId, '1')
        });

        document.getElementById('disconnectParticipant').addEventListener('click', function () {
            const userId = document.getElementById('userId').value;
            connectDisconnectParticipant(userId, '0')
        });
    };

    document.addEventListener('DOMContentLoaded', init);
}());
