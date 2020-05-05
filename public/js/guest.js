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

            const boxID = sessionStorage.getItem('selectedBoxPID');
            $(`#${boxID} .webcam-options`).addClass('enable')
            $(`#${boxID} .name`).text(sessionStorage.getItem('userName'))
            $(`#${boxID} .name`).show();

            $.ajax({
                url: "http://localhost:8082/live/demo/session",
                type: "post",
                "headers": {
                    "Content-Type": "application/json"
                },
                data: JSON.stringify({
                    broadcastStatus: true,
                    videoSource: sessionStorage.getItem('streamSource'),
                    prevBox: sessionStorage.getItem('selectedBoxPID')
                })
            });
        }
    })(vvOT);
}

let vvOTx;
var publishSelf = function (container, name = 'Guest', streamSource) {
    const properties = {name: container + ',' + name};
    const vidContainer = 'vidContainer' + container.replace(/[a-z]/g, '')
    if (!$(`#${container} #${vidContainer}`).length) {
        $(`#${container}`).append(`<div id="${vidContainer}"></div>`)
    }
    properties.container = vidContainer;
    if (streamSource === 'screen') {
        properties.videoSource = streamSource;
    }
    vvOTx.publishOwnStreams(properties);
    attachDOMEvents(vvOTx);
}

var init = function (credentials) {
    const props = {connectionEventsSuppressed: true};
    const vvOT = new vvOpenTok();
    vvOTx = vvOT;
    const icHandler = new IOpenTok();
    icHandler.onConnect = function (error) {
        if (error) {
            console.log(error);
        } else {
            vvOT.subcribesToStreams();
        }
    };
    vvOT.registerEvents(icHandler);
    vvOT.connect(props, credentials);
};

// document.addEventListener('DOMContentLoaded', init);
