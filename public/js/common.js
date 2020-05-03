const vvOpenTok = function () {
    let publisher;
    let controls = {};
    let session;
    let credentials;
    let mHandler;
    const subcribers = new Map();

    /**
     * Options for adding OpenTok publisher and subscriber video elements
     */
    var insertOptions = {
        width: '100%',
        height: '100%',
        showControls: true
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
     * Create an OpenTok publisher object
     */
    var initPublisher = function (options) {
        const mySearchParams = new URLSearchParams(location.search);
        var properties = {name: mySearchParams.get('name') || 'Host', ...options, ...insertOptions};
        return OT.initPublisher(options.container, properties);
    };

    /**
     * Subscribe to a stream
     */
    var subscribe = function (containerDiv, stream) {
        var name = stream.name;
        var properties = {name, insertMode: 'after', ...insertOptions};
        const subcriber = session.subscribe(stream, containerDiv, properties, function (error) {
            if (error) {
                console.log(error);
            }
        });
        addSubscriberControls(subcriber.id);
        subcribers.set(subcriber.id, subcriber);
        window.mSub = subcribers;
    };

    /**------------------------------
     * Toggle publishing audio/video to allow host to mute
     * their video (publishVideo) or audio (publishAudio)
     * @param {Object} publisher The OpenTok publisher object
     * @param {Object} el The DOM element of the control whose id corresponds to the action
     */
    var toggleMedia = function (publisher, el) {
        var enabled = el.classList.contains('disabled');
        el.classList.toggle('disabled');
        console.log('toggleMedia', el.id, enabled);
        window.mPub = publisher;
        publisher[el.id](enabled);
    };

    var setEventListeners = function (callThis) {
        session.on('streamCreated', callThis || function (event) {
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

    /**
     * The host starts publishing and signals everyone else connected to the
     * session so that they can start publishing and/or subscribing.
     * @param {Object} session The OpenTok session
     * @param {Object} publisher The OpenTok publisher object
     */
    this.publishOwnStreams = function (options) {
        publisher = initPublisher(options);
        window.mP = publisher;
        session.publish(publisher);
        controls.publisher = publisher;
        addPublisherControls(publisher);
    };

    this.unpublishStream = function () {
        session.unpublish(publisher);
        publisher = null;
    }

    this.getControls = function () {
        return Object.assign(controls, {subcribers});
    }

    this.subcribesToStreams = function (containerDiv) {
        setEventListeners(function (event) {
            window.mE = event;
            subscribe(containerDiv, event.stream);
            if (mHandler.onStreamCreated)
                mHandler.onStreamCreated(event);
        });
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
        session.connect(credentials.token, function () {
            if (mHandler.onConnect)
                mHandler.onConnect();
        });
        window.myS = session;
    };

    this.enableBroadcast = function () {
        const instance = vvOpenTokBroadcast.init(session);
        instance.registerEvents(mHandler);
        return instance;
    }
    // document.addEventListener('DOMContentLoaded', init);

    this.publisherAudio = function (value) {
        controls.publisher.publishAudio(value)
    }

    this.publisherVideo = function (value) {
        controls.publisher.publishVideo(value)
    }

    this.subscriberAudio = function (id, value) {
        controls.subscriber.get(id).subcribesToAudio(value)
    }
};
