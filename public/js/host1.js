(function () {
  var broadcast = { status: 'waiting', streams: 1 };
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
  var initPublisher = function () {
    const mySearchParams = new URLSearchParams(location.search);
    var properties = { name: mySearchParams.get('name') || 'Host', insertMode: 'before', ...insertOptions };
    return OT.initPublisher('hostDivider', properties);
  };

    /**
     * Send the broadcast status to everyone connected to the session using
     * the OpenTok signaling API
     * @param {Object} session
     * @param {String} status
     * @param {Object} [to] - An OpenTok connection object
     */
  var signal = function (session, status, to) {
    var signalData = Object.assign({}, { type: 'broadcast', data: status }, to ? { to } : {});
    console.log('signal', JSON.stringify(signalData));
    session.signal(signalData, function (error) {
      if (error) {
        console.log(['signal error (', error.code, '): ', error.message].join(''));
      } else {
        console.log('signal sent');
      }
    });
  };

    /**
     * Set the state of the broadcast and update the UI
     */
  var updateStatus = function (session, status) {
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

    /**
     * Make a request to the server to start the broadcast
     * @param {String} sessionId
     */
  var startBroadcast = function (session) {
    updateStatus(session, 'active');
    signal(session, 'active');
  };

    /**
     * Make a request to the server to stop the broadcast
     * @param {String} sessionId
     */
  var endBroadcast = function (session) {
    updateStatus(session, 'ended');
    signal(session, 'ended');
  };

    /**
     * Subscribe to a stream
     */
  var subscribe = function (session, stream) {
    var name = stream.name;
    var properties = { name, insertMode: 'after', ...insertOptions };
    session.subscribe(stream, 'hostDivider', properties, function (error) {
      if (error) {
        console.log(error);
      }
    });
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

  var setEventListeners = function (session, publisher) {

        // Add click handler to the start/stop button
    var startStopButton = document.getElementById('startStop');
    startStopButton.classList.remove('hidden');
    startStopButton.addEventListener('click', function () {
      if (broadcast.status === 'waiting') {
        startBroadcast(session);
      } else if (broadcast.status === 'active') {
        endBroadcast(session);
      }
    });

        // Subscribe to new streams as they're published
    session.on('streamCreated', function (event) {
      window.mE = event;
      subscribe(session, event.stream);
      broadcast.streams++;

      localStorage.setItem('tab-count', broadcast.streams);
      // if (broadcast.streams > 3) {
      //   document.getElementById('videoContainer').classList.add('wrap');
      // }
    });

    session.on('streamDestroyed', function () {
      broadcast.streams--;
      localStorage.setItem('tab-count', broadcast.streams);
      // if (broadcast.streams < 4) {
      //   document.getElementById('videoContainer').classList.remove('wrap');
      // }
    });

        // Signal the status of the broadcast when requested
    session.on('signal:broadcast', function (event) {
      if (event.data === 'status') {
        signal(session, broadcast.status, event.from);
      }
    });

    document.getElementById('publishVideo').addEventListener('click', function () {
      toggleMedia(publisher, this);
    });
    // document.getElementById('publishAudio').addEventListener('click', function () {
    //   toggleMedia(publisher, this);
    // });

  };

  var addPublisherControls = function (publisher) {
    var publisherContainer = document.getElementById(publisher.element.id);
    var el = document.createElement('div');
    var controls = [
      '<div class="publisher-controls-container">',
      '<div id="publishVideo" class="control video-control"></div>',
      // '<div id="publishAudio" class="control audio-control"></div>',
      '</div>',
    ].join('\n');
    el.innerHTML = controls;
    publisherContainer.appendChild(el.firstChild);
  };

    /**
     * The host starts publishing and signals everyone else connected to the
     * session so that they can start publishing and/or subscribing.
     * @param {Object} session The OpenTok session
     * @param {Object} publisher The OpenTok publisher object
     */
  var publishAndSubscribe = function (session, publisher) {
    session.publish(publisher);
    addPublisherControls(publisher);
    setEventListeners(session, publisher);
  };

  var init = function () {
    var credentials = getCredentials();
    var props = { connectionEventsSuppressed: true };
    var session = OT.initSession(credentials.apiKey, credentials.sessionId, props);
    var publisher = initPublisher();

    session.connect(credentials.token, function (error) {
      if (error) {
        console.log(error);
      } else {
        localStorage.removeItem('tab-count');
        publishAndSubscribe(session, publisher);
        window.myS = session;
      }
    });
    document.getElementById('inviteBtn').addEventListener('click', function () {
      let tabCount = Number(localStorage.getItem('tab-count'));
      console.log(tabCount);
      tabCount = tabCount || 0;
      if (tabCount > 3) {
        alert('max 4 can be a host a time')
        return;
      }
      window.open('http://localhost:8082/guest', `newtab${tabCount + 1}`);
      localStorage.setItem('tab-count', ++tabCount);
    });
  };

  document.addEventListener('DOMContentLoaded', init);

}());
