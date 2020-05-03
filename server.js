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
const port = process.env.PORT || 8082;
app.use('/pocapp',express.static(`${__dirname}/public`));
app.use(bodyParser.json());
app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

/** Services */
const opentok = require('./services/opentok-api');
/*
 * User Routes
 */

app.get('/', (req, res) => {
  res.redirect('/pocapp/viewer');
});

app.get('/pocapp/viewer', (req, res) => {
  opentok.getCredentials({type:'viewer', identity: req.})
    .then(credentials => res.render('pages/viewer', { credentials: JSON.stringify(credentials) }))
    .catch(error => res.status(500).send(error));
});

app.get('/pocapp/host', (req, res) => {
  opentok.getCredentials('host')
    .then(credentials => res.render('pages/host', { credentials: JSON.stringify(credentials) }))
    .catch(error => res.status(500).send(error));
});

app.get('/pocapp/guest', (req, res) => {
  opentok.getCredentials('guest')
    .then(credentials => res.render('pages/guest', { credentials: JSON.stringify(credentials) }))
    .catch(error => res.status(500).send(error));
});

app.get('*', (req, res) => {
  res.redirect('/viewer');
});

/*
 * Listen
 */
app.listen(process.env.PORT || port, () => console.log(`app listening on port ${port}`));

