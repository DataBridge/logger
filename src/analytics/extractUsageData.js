/**
* @author MonsieurWave <tensu.wave@gmail.com>
* @flow
*/

import fs from 'fs';
import { promisify } from 'util';
import { URL } from 'url';

import Domain from './Domain';
import saveToHub from './saveToHub';
import download from './download';
import computeFileSize from './computeFileSize';

const readFileAsync = promisify(fs.readFile);

// save queries per resource per domain
const domains = {};

/**
* Create new Domain and/Or new resource if they don't exist yet
*
* @param {string} origin name of the domain of the resource
* @param {string} resource name of the resource
* @param {string} url url of the resource
* @return {undefined} undefined
*/
function createIfNew(origin, resource, url) {
  if (!(origin in domains)) {
    domains[origin] = new Domain();
  }

  if (!(resource in domains[origin].resources)) {
    domains[origin].newResource(resource, url);
  }
}


/**
* Read logs and extract usage per resource for every domain
*
* @param {string} logFilePath path to the logFile
* @param {Object} logger logger instance used for logging in the analytics
* @return {undefined} undefined
*/
const extractUsageData = async (logFilePath, logger) => {
  const logFile = await readFileAsync(logFilePath, 'utf8');
  const logs = logFile.split('\n')
    .filter(logEntry => logEntry.length !== 0)
    .map(logEntry => JSON.parse(logEntry));

  // Delete empty files
  if (logs.length === 0) {
    return fs.unlink(logFilePath, (err) => {
      if (err) {
        logger.log('error-deleting-empty-log-file', { path: logFilePath }, 'error');
      }
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
      createIfNew(origin, resource, url.href);

      if (log.details.resourceOrigin === 'Peer') {
        domains[origin].resources[resource].peerLoads.push(1);
        domains[origin].resources[resource].fileSize = log.details.fileSize;
      } else {
        domains[origin].resources[resource].peerLoads.push(0);
      }

      domains[origin].resources[resource].timestamps.push(log.timestamp);
      domains[origin].resources[resource].IPs.push(log.ip);

      if (log.details.device == null) {
        domains[origin].resources[resource].devices.push('unknown');
      } else {
        domains[origin].resources[resource].devices.push(log.details.device);
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
    for (const resourceName of Object.keys(domains[domain].resources)) {
      const resource = domains[domain].resources[resourceName];

      if (isNaN(resource.fileSize)) {
        resource.fileSize = await download(resource.url, logger)   // download file
        .then(async (stream) => await computeFileSize(stream));
      }
    }

    saveToHub(domain, domains[domain].resources, logger)
    .then(() => domains[domain].reinitialise());
  }
  return true;
};

export default extractUsageData;
