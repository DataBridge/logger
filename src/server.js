/**
* @author Guillaume Leclerc <guillaume.leclerc.work@gmail.com>
* @flow
*/

import uuid from 'uuid';
import Koa from 'koa';
import cors from 'koa-cors';
import now from 'performance-now';
import { merge } from 'lodash';
import parse from 'co-body';
import { validate } from 'jsonschema';
import path from 'path';
import https from 'https';
import fs from 'fs';
import forceSSL from 'koa-sslify';
import CONSTANTS from 'constants';

import FileBackend from './backends/file';
import TCPBackend from './backends/tcp';
import Logger from './Logger';
import logSchema from './logSchema';

const app = new Koa();
const logfilename = process.env.DATABRIDGE_LOGFILE || './all.log';
const backends = [];
backends.push(new FileBackend(path.resolve(logfilename)));
const tcpHost = process.env.DATABRIDGE_LOGGER_TCP_HOST;
const tcpPort = process.env.DATABRIDGE_LOGGER_TCP_PORT;
if (tcpHost && tcpPort) {
  backends.push(new TCPBackend(tcpHost, tcpPort));
}
const logger = new Logger('databridge-logger', backends, 'main-logging-server');
const envKey = process.env.DATABRIDGE_KEY;
const envCertificate = process.env.DATABRIDGE_CERTIFICATE;

app.use(cors());

logger.log('logger-prepare');

// Build ctx.log method
app.use(async (ctx, next) => {
  const requestId = uuid.v4();
  ctx.log = (eventId, details, level) => { // eslint-disable-line no-param-reassign
    const allDetails = merge(details, {
      requestId,
    });
    logger.log(eventId, allDetails, level);
  };

  // Log the new request
  ctx.log('new-request', {
    ip: ctx.request.ip,
    forwardedFor: ctx.headers['x-forwarded-for'],
    length: ctx.request.length
  });
  await next();
});

// Filter out non-post requests
app.use(async (ctx, next) => {
  if (ctx.request.method === 'POST') {
    await next();
  } else {
    ctx.log('non-post-request', {
      method: ctx.request.method,
      url: ctx.request.url
    }, 'warning');
    ctx.response.status = 400;
    ctx.response.body = '';
  }
});

// Mesure request duration
app.use(async (ctx, next) => {
  const start = now();
  await next();
  const end = now();
  ctx.log('end-request', {
    requestDuration: end - start
  });
});

app.use(async (ctx, next) => {
  const startParsing = now();
  try {
    ctx.body = await parse.json(ctx.request, { limit: '100kb' });
  } catch (e) {
    ctx.log('invalid-json-request', {
      method: ctx.request.method,
      url: ctx.request.url
    }, 'warning');
    ctx.response.status = 400;
    ctx.response.body = '';
    return;
  }
  const endParsing = now();
  ctx.log('body-parsed', {
    parsingDuration: endParsing - startParsing,
  });
  await next();
});

app.use(async (ctx, next) => {
  const { errors, valid } = validate(ctx.body, logSchema);
  if (valid) {
    await next();
  } else {
    ctx.log('invalid-body', {
      errors
    });
    ctx.response.status = 400;
    ctx.response.body = '';
  }
});

app.use(async (ctx, next) => {
  const startStoring = now();
  const messages = ctx.body;
  await Promise.all(backends.map(backend => backend.store(messages)));
  const endStoring = now();
  ctx.log('logs-stored', {
    storingDuration: endStoring - startStoring
  });
  await next();
});

app.use(async ({ response }, next) => {
  response.status = 200;
  response.body = '';
  await next();
});

const port = process.env.NODE_PORT || 3000;
logger.log('logger-start-listen', {
  port
});

if (typeof envKey === 'undefined' ||
    typeof envCertificate === 'undefined' ||
    envKey === '' ||
    envCertificate === '') {
  app.listen(port);
} else {
  logger.log('logger-in-https');
  // Force SSL on all page
  app.use(forceSSL());
  const privateKey = fs.readFileSync(path.resolve(envKey), 'utf8');
  const certificate = fs.readFileSync(path.resolve(envCertificate), 'utf8');
  const credentials = { key: privateKey,
    cert: certificate,
    secureOptions: CONSTANTS.SSL_OP_NO_TLSv1_2
  };
  https.createServer(credentials, app.callback()).listen(port);
}
