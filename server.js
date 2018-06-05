const path = require('path');
const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const roles = require('./express/infrastructure/roles');

const distDirectory = path.join(__dirname, 'dist');

const HttpStatus = require('http-status-codes');

const route = require('./express/app');

const httpStatusCodes = require('http-status-codes');
const moment = require('moment');
const { Logger } = require('@hmcts/nodejs-logging');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  Logger.getLogger('BAR-WEB: server.js -> error').info(JSON.stringify(err));
  res.status(httpStatusCodes.INTERNAL_SERVER_ERROR);
  res.render('error', {
    title: httpStatusCodes.INTERNAL_SERVER_ERROR.toString(),
    message: 'The server encountered an internal error or misconfiguration and was unable to complete your request',
    moment
  });
}

module.exports = security => {
  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));

  // parse application/json - REMOVE THIS! https://expressjs.com/en/changelog/4x.html#4.16.0
  app.use(bodyParser.json());
  app.use(cookieParser());

  // use helmet for security
  app.use(helmet());
  app.use(helmet.noCache());
  app.use(helmet.frameguard());
  app.use(helmet.xssFilter());

  app.set('view engine', 'pug');
  app.set('views', path.join(__dirname, 'express/mvc/views'));

  app.use('/logout', security.logout());
  app.use('/oauth2/callback', security.OAuth2CallbackEndpoint());
  app.use(express.static('data'));
  app.use('/health', (req, res) => res.status(HttpStatus.OK).json({ status: 'UP' }));

  // allow access origin
  // @TODO - This will only take effect when on "dev" environment, but not on "prod"
  app.use('/api', (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Auth-Dev');
    next();
  });

  // make all routes available via this imported module
  app.use('/api', security.protectWithAnyOf(roles.allRoles), route);

  // enable the dist folder to be accessed statically
  app.use(security.protectWithAnyOf(roles.allRoles, ['/assets/']), express.static('dist'));

  // fallback to this route (so that Angular will handle all routing)
  app.get('**', security.protectWithAnyOf(roles.allRoles, ['/assets/']),
    (req, res) => res.sendFile(`${distDirectory}/index.html`));

  app.use(errorHandler);

  return app;
};
