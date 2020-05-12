'use strict';

/* eslint-env es6 */

/** Config */
const {apiKey, apiSecret} = require('../config');

/** Imports */
const Promise = require('bluebird');
const OpenTok = require('opentok');

// http://bluebirdjs.com/docs/api/promisification.html
const OT = Promise.promisifyAll(new OpenTok(apiKey, apiSecret));

/**
 * Returns options for token creation based on user type
 * @param {String} userType Host, guest, or viewer
 */
const tokenOptions = (user) => {
    const role = {
        host: 'moderator',
        presenter: 'publisher',
        viewer: 'subscriber',
    }[user.userType];

    return {role, data: JSON.stringify(user)};
};

/**
 * Create an OpenTok session
 * @param {Object} [options]
 * @returns {Promise} <Resolve => {Object}, Reject => {Error}>
 */
let sessions = {};
const createSession = (conversationId, options) =>
    new Promise((resolve, reject) => {
        const setActiveSession = (session) => {
            if (!sessions.hasOwnProperty(conversationId)) {
                sessions[conversationId] = {}
            }
            sessions[conversationId].activeSession = session;
            return Promise.resolve(session);
        };

        OT.createSessionAsync({mediaMode: 'routed'})
            .then(setActiveSession)
            .then(resolve)
            .catch(reject);
    });

/**
 * Create an OpenTok token
 * @param {String} userType Host, guest, or viewer
 * @returns {String}
 */
const createToken = (conversationId, user) => {
    return OT.generateToken(sessions[conversationId].activeSession.sessionId, tokenOptions(user));
}

/** Exports */

/**
 * Creates an OpenTok session and generates an associated token
 * @returns {Promise} <Resolve => {Object}, Reject => {Error}>
 */
const getCredentials = (conversationId, user) =>
    new Promise((resolve, reject) => {
        if (sessions.hasOwnProperty(conversationId) && sessions[conversationId].activeSession) {
            const token = createToken(conversationId, user);
            resolve({apiKey, sessionId: sessions[conversationId].activeSession.sessionId, token});
        } else {
            const addToken = (session) => {
                const token = createToken(conversationId, user);
                return Promise.resolve({apiKey, sessionId: session.sessionId, token});
            };
            createSession(conversationId)
                .then(addToken)
                .then(resolve)
                .catch(reject);
        }
    });

module.exports = {
    getCredentials,
    getSessions : () => sessions
};
