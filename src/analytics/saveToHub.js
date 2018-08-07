import axios from 'axios';
import { flatten } from 'lodash'; // eslint-disable-line
import Resource from './Resource';
import geolocate from './geographics/geolocate';

const hubAddress = process.env.DATABRIDGE_HUB_GRAPHQL || 'http://localhost:9000/graphql';

/**
* Save stats from loaded resources to Hub database
*
* @param {string} domainName name of the domain the resources
* @param {Object<Resource>} resources object with all loaded resources of this domain
* @return {Promise} undefined
*/
const saveToHub = async (domainName, resources: Object<Resource>): Promise => {
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

  // Defining the entry into the Stat table of the hub db
  const StatEntry = (timestamp, vlyntLoad, sotLoad, latitude, longitude, region, device) =>
    ({
      time: `"${new Date(timestamp).toISOString()}"`,
      DomainId: domainId,
      vlynt: vlyntLoad,
      fallback: sotLoad,
      latitude,
      longitude,
      region: `"${region}"`,
      category: `"${device}"`
    });

  // Create an array of request for every resource
  const stats = Object.values(resources)
  .map((resource) => resource.timestamps
  .map((timestamp, index) => {
    let vlyntLoad; let sotLoad;
    if (resource.peerLoads[index] === 1) {
      vlyntLoad = resource.fileSize;
      sotLoad = 0;
    } else {
      vlyntLoad = 0;
      sotLoad = resource.fileSize;
    }
    const { region, latitude, longitude } = geolocate(resource.IPs[index]);
    return new StatEntry(
      timestamp, vlyntLoad, sotLoad, latitude, longitude, region, resource.devices[index]
    );
  })
  )
  .flatten();

  const query = `
    mutation {
      createStats(input:
        ${JSON.stringify(stats).replace(/"/g, '').replace(/\\/g, '"')}
      ) {
        stats {
          id,
          DomainId,
          vlynt,
          fallback
        }
      }
  }`;

  axios({
    url: hubAddress,
    method: 'post',
    data: {
      query
    }
  }).then((result) => {
    console.log('hub response', result.data.data.createStats.stats)
  })
  .catch((e) => {
    console.log(e);
  });
}

export default saveToHub;
