/**
* @author Guillaume Leclerc <guillaume.leclerc.work@gmail.com>
* @flow
*/

import Chance from 'chance';
import Koa from 'koa';
import cors from 'koa-cors';
import now from 'performance-now';
import { merge } from 'lodash';
import parse from 'co-body';
import { validate } from 'jsonschema';
import path from 'path';
import https from 'https';
import fs from 'fs';
import forceSSL from 'koa-force-ssl';

import FileBackend from './backends/file';
import Logger from './Logger';
import logSchema from './logSchema';

const app = new Koa();
const randomGenerator = new Chance();
const logfilename = process.env.DATABRIDGE_LOGFILE || './all.log';
const backend = new FileBackend(path.resolve(logfilename));
const logger = new Logger('databridge-logger', backend, 'main-logging-server');
const envKey = process.env.DATABRIDGE_KEY;
const envCertificate = process.env.DATABRIDGE_CERTIFICATE;

app.use(cors());

logger.log('logger-prepare');

// Build ctx.log method
app.use(async (ctx, next) => {
  const requestId = randomGenerator.guid();
  ctx.log = (eventId, details, level) => { // eslint-disable-line no-param-reassign
    const allDetails = merge(details, {
      requestId,
    });
    logger.log(eventId, allDetails, level);
  };

  // Log the new request
  ctx.log('new-request', {
    ip: ctx.request.ip,
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
    ctx.body = await parse.json(ctx.request, { limit: '10kb' });
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
  await backend.store(messages);
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
     secureOptions: require('constants').SSL_OP_NO_TLSv1_2 };
  https.createServer(credentials, app.callback()).listen(port);
}
