const IOpenTok = function () {
    this.onStreamCreated = null;
    this.onStreamDestroyed = null;
    this.onConnect =  null;
    
    this.onBroadcastStart = null;
    this.onBroadcastEnd = null;

    this.broadcastStatus = null;
}
