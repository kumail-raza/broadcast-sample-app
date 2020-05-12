(function (window, $) {
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
            if ($('.OT_publisher').attr('id')) {
                vvOT.unpublishStream($('.OT_publisher').attr('id'));
            }
            const videoSourceOption = document.querySelector('select[name=videoSource]');
            const selectedOption = videoSourceOption.options[videoSourceOption.selectedIndex].value;
            const mySearchParams = new URLSearchParams(location.search);
            const properties = {
                name: mySearchParams.get('name') || 'Host',
                insertMode: 'before',
            };
            if (selectedOption === 'screen') {
                properties.videoSource = 'screen';
            }
            const container = createBox();
            vvOT.publishOwnStreams(container, properties);
        })
    }

    var sendBroadcastStatusToClient = (conversationId, type, status) => {
        var settings = {
            "url": "https://dev-pc.voicevoice.com/cmserver/api/startStopBroadcast",
            "method": "POST",
            "timeout": 0,
            "headers": {
                "Content-Type": "application/json"
            },
            "data": JSON.stringify({"conversationId": getFromSession('conversation', 'id'), "type": type, "status": status})
        };

        $.ajax(settings).done(function (response) {
            console.log(response);
        });
    }

    var attachBoxEvent = function () {
        const box = `#${(this).data('boxId')}`;
        if ($(box).find('.OT_publisher').length > 0) {
            const publisherId = $(box).find('.OT_publisher').attr('id')
            const btnType = $(this).data('button');
            if (btnType == 'audio') {
                if ($(this).hasClass('disable')) {
                    vvOT.publisher.publishAudio(true)
                    $(this).removeClass('fa-microphone-slash')
                    $(this).addClass('fa-microphone')
                } else {
                    mC.publisher.publishAudio(false)
                    $(this).removeClass('fa-microphone')
                    $(this).addClass('fa-microphone-slash')
                }
                $(this).toggleClass('disable')
            } else {
                if ($(this).hasClass('disable')) {
                    // mC.publisher.publishVideo(true)
                    // $(this).removeClass('fa-video-slash')
                    // $(this).addClass('fa-video')
                } else {
                    // mC.publisher.publishVideo(false)
                    // $(this).removeClass('fa-camera')
                    // $(this).addClass('fa-video-slash')
                }
                $(this).toggleClass('disable')
            }
        }
    }

    var createBox = () => {
        let boxId = getNextAvailableBox();
        if (!getNextAvailableBox()) {
            boxId = $('.box-container').children().length + 1;
            const box = $(`<div id="box${boxId}" class="box">
                <div class="header">
                    <button class="active dropdown-toggle" data-toggle="dropdown" disabled style="cursor: default" aria-haspopup="true"
                            aria-expanded="false"><span class="sno">1</span><span> Select source  <span
                                    class="caret"></span></span></button>
                    <ul class="dropdown-menu">
                        <li><a href="javascript:void(0)">Add New Source</a></li>
                        <li role="separator" class="divider"></li>
                        <h6 class="dropdown-header">AVAILABLE SOURCES</h6>
                        <li data-value="webcam"><a href="javascript:void(0)">Webcam</a></li>
                        <li data-value="screen"><a href="javascript:void(0)">ScreenShare</a></li>
                    </ul>
                    <div class="webcam-options enable">
                        <i aria-hidden="true" class="fa fa-video-camera icons-conf" data-button="video" data-box="box${boxId}"></i>
                        <i aria-hidden="true" class="fa fa-microphone icons-conf" data-button="audio" data-box="box${boxId}"></i>
                    </div>
                </div>
                <div id="vidContainer${boxId}" class="video-holder"></div>
                <span class="name"></span>
            </div>`)
            $('.box-container').append(box);

            // $(`#box${boxId} .webcam-options i`).on('click', attachBoxEvent(vvOT))
        }
        return 'vidContainer' + boxId;
    }

    var init = function (credentials) {
        const props = {connectionEventsSuppressed: true};
        const vvOT = new vvOpenTok();
        const icHandler = new IOpenTok();
        icHandler.onStreamPublished = (publisher, container) => {
            console.log(publisher, container)
            $(`#${container}`).siblings('.name').text(publisher.stream.name)
        }
        icHandler.onConnect = function (session, error) {
            if (error) {
                console.log(error);
            } else {
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
            $(`#${container}`).siblings('.name').text(event.stream.name)
        }
        icHandler.onStreamDestroyed = function (event) {
            broadcast.streams--;
            setTimeout(() => $(`#box${getNextAvailableBox()}`).remove(), 200);
            if (broadcast.streams < 2) {
                document.querySelector('.box-container').classList.remove('wrap')
            }
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
    };

    window.onbeforeunload = () => {
        console.log('closing')
        $.ajax({
            url: `https://qaapp.voicevoice.com/live/${getFromSession('conversation', 'id')}/session`,
            type: "delete"
        });
    }

    // ====

    var connectDisconnectParticipant = function (userId, status) {
        var settings = {
            "url": "https://dev-pc.voicevoice.com/cmserver/api/inviteParticipantInBroadcast",
            "method": "POST",
            "timeout": 0,
            "headers": {
                "Content-Type": "application/json"
            },
            "data": JSON.stringify({"userId": userId, "status": status}),
            "success": (res) => console.log(res)
        };
        $("#newSourceModal").modal('hide')
        $.ajax(settings).done(function (response) {
            console.log(response);
        });
    }

    var addTree = (data) => {
        const conversation = data.reservationLess;
        if (conversation) {
            const schedule = conversation;
            const groups = []
            for (let group in schedule) {
                const users = schedule[group].map(user => {
                    return `<li data-id="${user.id}">${user.name} (${user.id})</li>`
                })
                groups.push('<li>\n<span class="arrow">' + group + '</span>\n<ul class="nested">\n ' + users.join('\n ') + '\n</ul>\n</li>')
            }
            console.log(groups.join('\n'));
            $('#tree ul').html(groups.join('\n'))
        }


        var toggler = document.getElementById('tree').getElementsByClassName("arrow");
        for (let i = 0; i < toggler.length; i++) {
            toggler[i].addEventListener("click", function () {
                this.parentElement.querySelector(".nested").classList.toggle("active");
                this.classList.toggle("arrow-down");
            });
        }
        $('#tree ul.nested li').on('click', function () {
            console.log($(this))
            const userId = $(this).data('id');
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                window.selectedUsers.splice(window.selectedUsers.indexOf(userId), 1)
                return;
            }
            if (broadcast.streams > 3) {
                alert('max 4 can be host at a time')
                return;
            }
            $(this).addClass('selected')
            window.selectedUsers = window.selectedUsers || [];
            window.selectedUsers.push(userId);

            connectDisconnectParticipant(userId, '1');
        })
    }

    var ifConversationIsOnGoing = () => {
        getToken('132', 'Kumail', 'host').then(res => {
            init(res)
        })
    }

    var conversationStringId = location.href.replace(/(https.*.com\/live\/)/, '')

    var alreadyConnectedToTokBox = false;
    var fetchLatestState = () => {
        if (($("#newSourceModal").data('bs.modal') || {}).isShown) {
            return
        }
        $.ajax({
            url: "https://dev-pc.voicevoice.com/cmserver/api/getServerState",
            type: "get",
            success: (response) => {
                delete response.data.UFO;
                window.xx = response;
                if (Object.keys(response.data).length) {
                    // console.log(JSON.stringify(response, undefined, 2))
                    let conversationId = null;
                    for (let cId in response.data) {
                        if (response.data[cId].stringId.toLowerCase() === conversationStringId.toLowerCase()) {
                            conversationId = cId;
                            break;
                        }
                    }
                    if (conversationId) {
                        $('#error h3').text('Loading ...')

                        sessionStorage.setItem('conversation', JSON.stringify({
                            id: conversationId,
                            stringId: conversationStringId
                        }))

                        addTree(response.data[conversationId]);

                        if (!alreadyConnectedToTokBox) {
                            getToken('132', 'Kumail', 'host').then(res => {
                                $('#error').css('display', 'none')
                                $('.box-container').css('display', 'flex')
                                init(res)
                                alreadyConnectedToTokBox = true;
                            })
                        }
                    }
                }
            }
        });
    }
    setInterval(() => fetchLatestState(), 10000);
    fetchLatestState();
})(window, jQuery);
