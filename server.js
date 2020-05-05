/* eslint-env es6 */

/*
 * Dependencies
 */
const express = require('express');
const bodyParser = require('body-parser');
const R = require('ramda');

/*
 * Config
 */
const app = express();
const port = process.env.PORT || 8083;
app.use('/live', express.static(`${__dirname}/public`));
app.use(bodyParser.json());
app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

/** Services */
const opentok = require('./services/opentok-api1');
const memory = require('./services/memory')
/*
 * User Routes
 */

app.get('/', (req, res) => {
    res.redirect('/live/viewer');
});

app.post('/live/:conversationId/accessToken', (req, res) => {
    opentok.getCredentials(req.params.conversationId, req.body.user)
        .then(credentials => res.json(credentials))
        .catch(error => res.status(500).send(error));
});

app.get('/live/:conversationId/viewer', (req, res) => {
    opentok.getCredentials(req.params.conversationId, {userType: 'viewer'})
        .then(credentials => res.render('pages/viewer', {credentials: JSON.stringify(credentials)}))
        .catch(error => res.status(500).send(error));
});

app.post('/live/:conversationId/session', (req, res) => {
    memory.storeCache(req.params.conversationId, req.body)
    res.status(200).json({success: true})
});

app.delete('/live/:conversationId/session', (req, res) => {
    memory.deleteCache(req.params.conversationId)
    res.status(200).json({success: true})
});

app.delete('/live/:conversationId/session/force', (req, res) => {
  memory.deleteCache(req.params.conversationId, true)
  res.status(200).json({success: true})
});


app.get('/live/:conversationId/session', (req, res) => {
    const cache = memory.getCache(req.params.conversationId);
    res.status(200).json({success: true, data: cache})
});


app.get('/live/:conversationId', (req, res) => {
    res.render('pages/host', {credentials: '{}'})
    //     .catch(() => {
    //     res.status(500).send(error)
    // })
});

app.get('/live/:conversationId/host', (req, res) => {
    opentok.getCredentials(req.params.conversationId, {userType: 'host'})
        .then(credentials => res.render('pages/host', {credentials: JSON.stringify(credentials)}))
        .catch(error => res.status(500).send(error));
});

app.get('/live/:conversationId/guest', (req, res) => {
  opentok.getCredentials(req.params.conversationId, {userType: 'guest'})
      .then(credentials => res.render('pages/guest', {credentials: JSON.stringify(credentials)}))
      .catch(error => res.status(500).send(error));
});
app.get('/live/:conversationId/presenter', (req, res) => {
  res.render('pages/presenter', {credentials: '{}'})
});

app.get('*', (req, res) => {
    res.redirect('/viewer');
});

/*
 * Listen
 */
app.listen(process.env.PORT || port, () => console.log(`app listening on port ${port}`));

