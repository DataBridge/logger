/**
* @author MonsieurWave <tensu.wave@gmail.com>
* @flow
*/

import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import { URL } from 'url';
import axios from 'axios';

import Domain from './Domain.js';

const hubAddress = process.env.DATABRIDGE_HUB_GRAPHQL || 'http://localhost:9000/graphql';

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

const saveStatToHub = async (domainName, timestamp, vlyntStat, sotStat) => {
  // get the id corresponding to this domain name
  const domainIdQueryResult = await axios({
    url: hubAddress,
    method: 'post',
    data: {
      query: `
        query {
          domainsByName(name: "${domainName}") {
            id
            verified
          }
        }`
    }
  });

  // only take verified domains under this name
  const verifiedDomains = domainIdQueryResult.data.data.domainsByName
  .filter(domain => domain.verified === true);
  if (verifiedDomains === undefined || verifiedDomains.length === 0) {
    // no verified domain
    console.log('no verified domains in db for', domainName)
    return;
  }
  // take last domain in list as it is the most recent to have been verified
  const domainId = verifiedDomains[verifiedDomains.length - 1].id;

  axios({
    url: hubAddress,
    method: 'post',
    data: {
      query: `
        mutation {
          createStats(input: [
            {
              time: "${new Date(timestamp).toISOString()}",
              DomainId: ${domainId},
              vlynt: ${vlyntStat},
              fallback: ${sotStat}
            }
          ]) {
            stats {
              id,
              DomainId,
              vlynt,
              fallback
            }
          }
      }`
    }
  }).then((result) => {
    console.log(result.data.data.createStats.stats)
  })
  .catch((e) => {
    console.log(e);
  });
}

const extractUsage = async (logFilePath) => {
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

    // conversion to GB
    vlyntStat *= 1e-9;
    sotStat *= 1e-9;
    console.log('Vlynt load for', domain, ':', vlyntStat);
    console.log('SoT load for', domain, ':', sotStat);
    saveStatToHub(domain, Date.now(), vlyntStat, sotStat);
    return true;
  }

  // TODO : send local file to storage + delete local log
};

// saveStatToHub('localhost', Date.now(), 1, 0);
// getUsage('./test.log');
