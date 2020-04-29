const vvOpenTokBroadcast = new function () {
    let mHandler;
    let status;
    let session;

    /**
     * Send the broadcast status to everyone connected to the session using
     * the OpenTok signaling API
     * @param {Object} session
     * @param {String} status
     * @param {Object} [to] - An OpenTok connection object
     */
    const signal = function (to) {
        var signalData = Object.assign({}, {type: 'broadcast', data: status}, to ? {to} : {});
        console.log('signal', JSON.stringify(signalData));
        session.signal(signalData, function (error) {
            if (error) {
                console.log(['signal error (', error.code, '): ', error.message].join(''));
            } else {
                console.log('signal sent');
                if (status === 'active')
                    mHandler.onBroadcastStart();
                else
                    mHandler.onBroadcastEnd();
            }
        });
    };

    const registerEvents = function (handler) {
        mHandler = handler;
    }

    /**
     * Make a request to the server to start the broadcast
     * @param {String} sessionId
     */
    const startBroadcast = function (session, to) {
        status = 'active';
        signal(to);
    };

    /**
     * Make a request to the server to stop the broadcast
     * @param {String} sessionId
     */
    const endBroadcast = function (session, to) {
        status = 'ended'
        signal(to);
    };

    this.init = function (OTSession) {
        session = OTSession;

        // Signal the status of the broadcast when requested
        session.on('signal:broadcast', function (event) {
            if (event.data === 'status') {
                signal(event.from);
            }
        });

        return {
            startBroadcast,
            endBroadcast,
            registerEvents
        }
    }
};
