/* eslint-disable object-shorthand */
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

    /**
     * Update the banner based on the status of the broadcast (active or ended)
     */
    var updateBanner = function (status) {
        var banner = document.getElementById('banner');
        var bannerText = document.getElementById('bannerText');

        if (status === 'active') {
            banner.classList.add('hidden');
        } else if (status === 'ended') {
            bannerText.classList.add('red');
            bannerText.innerHTML = 'The Broadcast is Over';
            banner.classList.remove('hidden');
        }
    };

    var init = function () {
        const credentials = getCredentials();
        const props = {connectionEventsSuppressed: true};
        const vvOT = new vvOpenTok();
        const icHandler = new IOpenTok();
        icHandler.onConnect = function (error) {
            if (error) {
                console.log(error);
            } else {
                vvOT.enableBroadcastListener('hostDivider');
            }
        };
        icHandler.broadcastStatus = function (status) {
            updateBanner(status);
        }
        vvOT.registerEvents(icHandler);
        vvOT.connect(props, credentials);
    };

    document.addEventListener('DOMContentLoaded', init);

}());
