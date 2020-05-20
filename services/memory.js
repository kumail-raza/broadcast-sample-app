'use strict';
// let Redis = require('ioredis')
// let redis = new Redis({
//     port: 6379, // Redis port
//     host: '127.0.0.1', // Redis host
//     // family: 4,           // 4 (IPv4) or 6 (IPv6)
//     // password: 'auth',
//     db: 2
// })

let cache = {conversations: {}};
let cacheClearTimer = {}

const storeCache = (conversationId, data) => {
    clearTimeout(cacheClearTimer[conversationId]);
    cache.conversations[conversationId] = cache.conversations[conversationId] || {};
    cache.conversations[conversationId] = {...cache.conversations[conversationId], ...data};
    // broacast enabel, videosurce, previousbox
}

const getCache = (conversationId) => {
    clearTimeout(cacheClearTimer[conversationId]);
    if (cache.conversations[conversationId]) {
        return cache.conversations[conversationId];
    }
    return null;
}

const deleteCache = (conversationId, force) => {
    if (force) {
        if (cache.conversations[conversationId]) {
            delete cache.conversations[conversationId];
        }
        return null;
    }
    console.log('set timer for clearing cache')
    clearTimeout(cacheClearTimer[conversationId]);
    cacheClearTimer[conversationId] = setTimeout((conversationId) => {
        console.log('clearing the session');
        if (cache.conversations[conversationId]) {
            delete cache.conversations[conversationId];
        }
    }, 5 * 60 * 1000, conversationId);
    return null;
}

module.exports = {
    storeCache,
    getCache,
    deleteCache
};
