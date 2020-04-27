(function () {
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


    var attachDOMEvents = function (vvOT) {

        document.querySelector('select[name=videoSource]').addEventListener('change', function (ev) {
            vvOT.unpublishStream();
            const videoSourceOption = document.querySelector('select[name=videoSource]');
            const selectedOption = videoSourceOption.options[videoSourceOption.selectedIndex].value;
            delete properties.videoSource;
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
        const icHandler = new ICommonJS();
        icHandler.onConnect = function (error) {
            if (error) {
                console.log(error);
            } else {
                const mySearchParams = new URLSearchParams(location.search);
                const properties = {
                    container: 'hostDivider',
                    name: mySearchParams.get('name') || 'Guest',
                    insertMode: 'after'
                };
                vvOT.publishOwnStreams(properties);
                vvOT.subcribesToStreams('hostDivider');

                attachDOMEvents(vvOT);
            }
        };
        vvOT.setHandlers(icHandler);
        vvOT.init(props, credentials);
    };

    document.addEventListener('DOMContentLoaded', init);
}());
