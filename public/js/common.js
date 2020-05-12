const vvOpenTok = function () {
    let session;
    let mHandler;
    const publishers = new Map();

    /**
     * Options for adding OpenTok publisher and subscriber video elements
     */
    var insertOptions = {
        width: '100%',
        height: '100%',
        showControls: false
    };

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
     * Subscribe to a stream
     */
    this.subscribe = function (container, stream, props) {
        var name = stream.name;
        var properties = {name, ...insertOptions, ...props};
        const subcriber = session.subscribe(stream, container, properties, function (error) {
            if (error) {
                console.log(error);
            }
        });
        addSubscriberControls(subcriber.id);
    };

    var toggleMedia = function (publisher, el) {
        var enabled = el.classList.contains('disabled');
        el.classList.toggle('disabled');
        console.log('toggleMedia', el.id, enabled);
        publisher[el.id](enabled);
    };

    var setEventListeners = function () {
        session.on('streamCreated', function (event) {
            if (mHandler.onStreamCreated)
                mHandler.onStreamCreated(event);
        });
        session.on('streamDestroyed', function (event) {
            if (mHandler.onStreamDestroyed)
                mHandler.onStreamDestroyed(event);
        });
    };

    var addSubscriberControls = function (subscriberDivId) {
        console.log(subscriberDivId)
        var sContainer = document.getElementById(subscriberDivId);
        var el = document.createElement('div');
        el.innerHTML = `<div class="subcriber-controls-container" data-subcriberId="${subscriberDivId}">
                            <div class="sub-togl-video control video-control"></div>
                            <div class="sub-togl-audio control audio-control"></div>
                        </div>`;
        sContainer.appendChild(el.firstChild);
        sContainer.querySelector('.sub-togl-audio').addEventListener('click', function (ev) {
            var enabled = ev.target.classList.contains('disabled');
            ev.target.classList.toggle('disabled');
            console.log('toggleMedia', el.id, enabled);
            subcribers.get(subscriberDivId).subscribeToAudio(enabled)
        })
        sContainer.querySelector('.sub-togl-video').addEventListener('click', function (ev) {
            var enabled = ev.target.classList.contains('disabled');
            ev.target.classList.toggle('disabled');
            console.log('toggleMedia', el.id, enabled);
            subcribers.get(subscriberDivId).subscribeToVideo(enabled)
        })
    };

    var addPublisherControls = function (publisher) {
        var publisherContainer = document.querySelector(`#${publisher.element.id}`);
        var el = document.createElement('div');
        var controls = [
            '<div class="publisher-controls-container">',
            '<div id="publishVideo" class="control video-control"></div>',
            '<div id="publishAudio" class="control audio-control"></div>',
            '</div>',
        ].join('\n');
        el.innerHTML = controls;
        publisherContainer.appendChild(el.firstChild);
        publisherContainer.querySelector('#publishVideo').addEventListener('click', function () {
            toggleMedia(publisher, this);
        });
        publisherContainer.querySelector('#publishAudio').addEventListener('click', function () {
            toggleMedia(publisher, this);
        });
    };

    this.publishOwnStreams = function (container, props) {
        var properties = {...props, ...insertOptions};
        const publisher = OT.initPublisher(container, properties);
        session.publish(publisher, function () {
            if (mHandler.onStreamPublished)
                mHandler.onStreamPublished(publisher, container);
        });
        addPublisherControls(publisher);
        publishers.set(publisher.id, publisher)

        window.mPs = publishers ;
    };

    this.unpublishStream = function (id) {
        session.unpublish(publishers.get(id));
    }

    this.enableBroadcastListener = function (container) {
        vvOpenTokBroadcastListener.init(session, container, mHandler);
    }

    this.registerEvents = function (handler) {
        mHandler = handler;
    }

    this.connect = function (props, credentials) {
        var credentials = credentials || getCredentials();
        session = OT.initSession(credentials.apiKey, credentials.sessionId, props);
        session.connect(credentials.token, function (error) {
            if (mHandler.onConnect)
                mHandler.onConnect(session, error);

            setEventListeners();
        });
        window.myS = session;
    };

    this.enableBroadcast = function () {
        const instance = vvOpenTokBroadcast.init(session);
        instance.registerEvents(mHandler);
        return instance;
    }
    // document.addEventListener('DOMContentLoaded', init);
};
