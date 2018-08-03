/**
* @author MonsieurWave <tensu.wave@gmail.com>
* @flow
*/

import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import { URL } from 'url';

import Domain from './Domain.js';

const readFileAsync = promisify(fs.readFile);

// save queries per resource per domain
const domains = {};

const createIfNew = (origin, resource) => {
  if (!(origin in domains)) {
    domains[origin] = new Domain();
  }

  if (!(resource in domains[origin].resources)) {
    domains[origin].newResource(resource);
  }
};

const getUsage = async (logFilePath) => {
  logFilePath = path.resolve(__dirname, './1522537062332.log');
  const logFile = await readFileAsync(logFilePath, 'utf8');
  const logs = logFile.split('\n')
    .filter(logEntry => logEntry.length !== 0)
    .map(logEntry => JSON.parse(logEntry));

  // Delete empty files
  if (logs.length === 0) {
    return fs.unlink(logFilePath, (err) => {
      if (err) {
        console.log(err);
      }
      console.log(logFilePath, 'was deleted');
    });
  }

  for (const domain of Object.keys(domains)) {
    domains[domain].reinitialise();
  }

  logs.forEach((log) => {
    if (log.eventId === 'resource-obtained') {
      const url = new URL(log.details.resource);
      const origin = url.hostname;
      const resource = url.pathname;
      createIfNew(origin, resource);

      if (log.details.resourceOrigin === 'Peer') {
        domains[origin].resources[resource].peerLoads += 1;
        domains[origin].resources[resource].fileSize = log.details.fileSize;
      } else {
        domains[origin].resources[resource].sotLoads += 1;
      }
    }

    if (log.eventId === 'fileinfoloader-successful') {
      const url = new URL(log.details.url);
      const origin = url.hostname;
      const resource = url.pathname;
      createIfNew(origin, resource);
      domains[origin].resources[resource].fileSize = log.details.size;
    }
  });

  for (const domain of Object.keys(domains)) {
    let vlyntStat = 0;
    let sotStat = 0;

    for (const resourceName of Object.keys(domains[domain].resources)) {
      const resource = domains[domain].resources[resourceName];
      if (isNaN(resource.fileSize)) {
        console.log('No file size found for ', resourceName)
      } else {
        vlyntStat += resource.peerLoads * resource.fileSize;
        sotStat += resource.sotLoads * resource.fileSize;
      }
    }

    vlyntStat *= 1e-6;
    sotStat *= 1e-6;
    console.log('Vlynt load for', domain, ':', vlyntStat);
    console.log('SoT load for', domain, ':', sotStat);
    return true;
  }

  // TODO : send local file to storage + delete local log
};

getUsage('./test.log');
