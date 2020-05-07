const vvOpenTok = function () {
    let publisher;
    let session;
    let mHandler;

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
     * Subscribe to a stream
     */
    this.subscribe = function (containerDiv, stream, props) {
        var name = stream.name;
        var properties = {name, ...insertOptions, ...props};
        const subcriber = session.subscribe(stream, containerDiv, properties, function (error) {
            if (error) {
                console.log(error);
            }
        });
        addSubscriberControls(subcriber.id);
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

    /**
     * The host starts publishing and signals everyone else connected to the
     * session so that they can start publishing and/or subscribing.
     * @param {Object} session The OpenTok session
     * @param {Object} publisher The OpenTok publisher object
     */
    this.publishOwnStreams = function (container, props) {
        var properties = {...props, ...insertOptions};
        publisher = OT.initPublisher(container, properties);
        session.publish(publisher, function () {
            if (mHandler.onStreamPublished)
                mHandler.onStreamPublished();
        });
        addPublisherControls(publisher);
    };

    this.unpublishStream = function () {
        session.unpublish(publisher);
        publisher = null;
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
