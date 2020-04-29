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
            startStopButton.classList.add('active');
            startStopButton.innerHTML = 'End Broadcast';
        } else {
            startStopButton.classList.remove('active');
            startStopButton.innerHTML = 'Broadcast Over';
            startStopButton.disabled = true;
        }
    };

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
                window.mC = vvOT.getControls();

                attachDOMEvents(vvOT);
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
        vvOT.registerEvents(icHandler);
        vvOT.connect(props, credentials);

        var startStopButton = document.getElementById('startStop');
        startStopButton.classList.remove('hidden');
        startStopButton.addEventListener('click', function () {
            if (!broadcastHandler) {
                broadcastHandler = vvOT.enableBroadcast();
            }
            if (broadcast.status === 'waiting') {
                broadcastHandler.startBroadcast();
            } else if (broadcast.status === 'active') {
                broadcastHandler.endBroadcast();
            }
        });

        document.getElementById('inviteBtn').addEventListener('click', function () {
            let tabCount = Number(localStorage.getItem('tab-count'));
            console.log(tabCount);
            tabCount = tabCount || 0;
            if (tabCount > 3) {
                alert('max 4 can be a host a time')
                return;
            }
            window.open('http://localhost:8082/guest', `newtab${tabCount + 1}`);
            localStorage.setItem('tab-count', ++tabCount);
        });
    };

    document.addEventListener('DOMContentLoaded', init);
}());
