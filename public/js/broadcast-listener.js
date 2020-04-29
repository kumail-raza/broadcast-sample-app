const vvOpenTokBroadcastListener = new function () {
    let mHandler;
    let session;
    let mContainerDiv;

    /**
     * Options for adding OpenTok publisher and subscriber video elements
     */
    var insertOptions = {
        width: '100%',
        height: '100%',
        showControls: true
    };

    /** Ping the host to see if the broadcast has started */
    var checkBroadcastStatus = function () {
        session.signal({
            type: 'broadcast',
            data: 'status'
        });
    };

    /**
     * Subscribe to a stream
     * @returns {Object} A subsriber object
     */
    var subscribe = function (containerDiv, stream) {
        var name = stream.name;
        var insertMode = name === 'Host' ? 'before' : 'after';
        var properties = { name, insertMode, ...insertOptions };
        return session.subscribe(stream, containerDiv, properties, function (error) {
            if (error) {
                console.log(error);
            }
        });
    };

    /**
     * Listen for events on the OpenTok session
     */
    var setEventListeners = function () {
        var streams = [];
        var subscribers = [];
        var broadcastActive = false;

        /** Subscribe to new streams as they are published */
        session.on('streamCreated', function (event) {
            streams.push(event.stream);
            if (broadcastActive) {
                subscribers.push(subscribe(mContainerDiv, event.stream));
            }
        });

        session.on('streamDestroyed', function (event) {
            var index = streams.indexOf(event.stream);
            streams.splice(index, 1);
        });

        /** Listen for a broadcast status update from the host */
        session.on('signal:broadcast', function (event) {
            var status = event.data;
            broadcastActive = status === 'active';
            if (status === 'active') {
                streams.forEach(function (stream) {
                    subscribers.push(subscribe(mContainerDiv, stream));
                });
            } else if (status === 'ended') {
                subscribers.forEach(function (subscriber) {
                    session.unsubscribe(subscriber);
                });
            }
            if (mHandler.broadcastStatus) {
                mHandler.broadcastStatus(status);
            }
        });
    };

    this.init = function (OTSession, containerDiv, handler) {
        session = OTSession;
        mContainerDiv = containerDiv;
        mHandler = handler;
        setEventListeners();
        checkBroadcastStatus();

        return {checkBroadcastStatus}
    }
};
