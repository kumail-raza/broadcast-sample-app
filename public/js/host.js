(function () {
    var broadcast = {status: 'waiting', streams: 1};
    let broadcastHandler;

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

    var createBox = () => {
        const boxId = $('.box-container').children().length + 1;
        const box = $(`<div id="box${boxId}" class="box">
                <div class="header">
                    <button class="active  dropdown-toggle" data-toggle="dropdown" aria-haspopup="true"
                            aria-expanded="false"><span class="sno">1</span><span> Select source  <span
                                    class="caret"></span></span></button>
                    <ul class="dropdown-menu">
                        <li><a href="javascript:void(0)">Add New Source</a></li>
                        <li role="separator" class="divider"></li>
                        <h6 class="dropdown-header">AVAILABLE SOURCES</h6>
                        <li data-value="webcam"><a href="javascript:void(0)">Webcam</a></li>
                        <li data-value="screen"><a href="javascript:void(0)">ScreenShare</a></li>
                    </ul>
                    <div class="webcam-options">
                        <i aria-hidden="true" class="fa fa-video-camera icons-conf" data-button="video"></i>
                        <i aria-hidden="true" class="fa fa-microphone icons-conf" data-button="audio"></i>
                    </div>
                </div>
                <div id="vidContainer${boxId}" class="video-holder"></div>
                <span class="name"></span>
            </div>`)
        $('.box-container').append(box);
        return 'vidContainer' + boxId;
    }

    var init = function () {
        const credentials = getCredentials();
        const props = {connectionEventsSuppressed: true};
        const vvOT = new vvOpenTok();
        const icHandler = new IOpenTok();
        icHandler.onStreamPublished = () => {
            console.log('published')
        }
        icHandler.onConnect = function (error) {
            if (error) {
                console.log(error);
            } else {
                localStorage.removeItem('tab-count');
                const mySearchParams = new URLSearchParams(location.search);
                const properties = {
                    name: mySearchParams.get('name') || 'Host',
                    insertMode: 'before',
                };
                const container = createBox();
                vvOT.publishOwnStreams(container, properties);

                attachDOMEvents(vvOT);
                document.getElementById('startStop').disabled = false;
            }
        };
        icHandler.onStreamCreated = function (event) {
            broadcast.streams++;
            if (broadcast.streams > 1) {
                document.querySelector('.box-container').classList.add('wrap')
            }
            window.mE = event;

            let container;
            // if (($("#newSourceModal").data('bs.modal') || {}).isShown)
            //     container = 'vidContainer001';
            // else
                container = createBox();
            vvOT.subscribe(container, event.stream, {insertMode: 'after'});

            localStorage.setItem('tab-count', broadcast.streams);
        }
        icHandler.onStreamDestroyed = function () {
            broadcast.streams--;

            if (broadcast.streams < 2) {
                document.querySelector('.box-container').classList.remove('wrap')
            }
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

    // document.addEventListener('DOMContentLoaded', init);
    window.onbeforeunload = () => {
        console.log('closing')
        $.ajax({
            url: "https://qaapp.voicevoice.com/live/demo/session",
            type: "delete"
        });
    }
}());
