var broadcast = {status: 'waiting', streams: 1};
let broadcastHandler;

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
    window.toggleStreams = (function () {
        return function () {
            // var occupied = $('#' + selectedBox).parent().find('[class*="OT_pub"]').length > 0 ||
            //     $('#' + selectedBox).parent().find('[class*="OT_sub"]').length > 0;
            // if (occupied) {
            const prevSelectedBox = sessionStorage.getItem('prevSelectedBox');
            $(`#${prevSelectedBox} .webcam-options`).removeClass('enable')
            $(`#${prevSelectedBox} .name`).text('')
            $(`#${prevSelectedBox} .name`).hide();
            vvOT.unpublishStream();
            // }

            const selectedBox = sessionStorage.getItem('selectedBox') || 'box1';
            const properties = {name: selectedBox + ',' + sessionStorage.getItem('userName')};
            const vidContainer = 'vidContainer' + selectedBox.replace(/[a-z]/g, '')
            if (!$(`#${selectedBox} #${vidContainer}`).length) {
                $(`#${selectedBox}`).append(`<div id="${vidContainer}"></div>`)
            }
            properties.container = vidContainer;

            if (sessionStorage.getItem('streamSource') === 'screen') {
                properties.videoSource = 'screen';
            }
            vvOT.publishOwnStreams(properties);

            $(`#${selectedBox} .webcam-options`).addClass('enable')
            $(`#${selectedBox} .name`).text(sessionStorage.getItem('userName'))
            $(`#${selectedBox} .name`).show();

            $.ajax({
                url: "https://qaapp.voicevoice.com/live/demo/session",
                type: "post",
                "headers": {
                    "Content-Type": "application/json"
                },
                data: JSON.stringify({
                    broadcastStatus: true,
                    videoSource: sessionStorage.getItem('streamSource'),
                    prevBox: sessionStorage.getItem('selectedBox')
                })
            });
        }
    })(vvOT);
}

var init = function (credentials, container, name = 'Host', streamSource) {
    const props = {connectionEventsSuppressed: true};
    const vvOT = new vvOpenTok();
    const icHandler = new IOpenTok();
    icHandler.onConnect = function (error) {
        if (error) {
            console.log(error);
        } else {
            localStorage.removeItem('tab-count');

            const properties = {name: container + ',' + name};

            properties.container = vidContainer;

            if (streamSource === 'screen') {
                properties.videoSource = streamSource;
            }
            vvOT.publishOwnStreams(properties);

            vvOT.subcribesToStreams();
            window.mC = vvOT.getControls();

            $(`#${container} .webcam-options`).addClass('enable')
            $(`#${container} .name`).text(name)
            attachDOMEvents(vvOT);

            $.ajax({
                url: "https://qaapp.voicevoice.com/live/demo/session",
                type: "post",
                "headers": {
                    "Content-Type": "application/json"
                },
                data: JSON.stringify({
                    broadcastStatus: true,
                    videoSource: sessionStorage.getItem('streamSource'),
                    prevBox: container
                })
            });


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

    // document.getElementById('inviteBtn').addEventListener('click', function () {
    //     let tabCount = Number(localStorage.getItem('tab-count'));
    //     console.log(tabCount);
    //     tabCount = tabCount || 0;
    //     if (tabCount > 3) {
    //         alert('max 4 can be a host a time')
    //         return;
    //     }
    //     window.open('http://localhost:808e/guest', `newtab${tabCount + 1}`);
    //     localStorage.setItem('tab-count', ++tabCount);
    // });
};

// document.addEventListener('DOMContentLoaded', init);
window.onbeforeunload = () => {
    console.log('closing')
    $.ajax({
        url: "https://qaapp.voicevoice.com/live/demo/session",
        type: "delete"
    });
}
