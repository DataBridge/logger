/**
* @author MonsieurWave <tensu.wave@gmail.com>
* @flow
*/

import geoip from 'geoip-lite';
import * as regions from './countryToRegion.json';
import * as regionDefaults from './regionDefaults.json';


/**
* Search for geographical information related to this IP
*
* @param {String} ip a given IP address
* @return {Object} region and coordinates corresponding to this IP
*/
function geolocate(ip: string): Promise<Object> {
  const geoInfo = geoip.lookup(ip);

  if (geoInfo == null) {
    return { region: 'unknown', latitude: NaN, longitude: NaN };
  }

  const [region] = Object.keys(regions)
  // eslint-disable-next-line no-prototype-builtins
  .filter(regionName => regions[regionName].hasOwnProperty(geoInfo.country.toLowerCase()));

  let latitude = geoInfo.ll[0];
  let longitude = geoInfo.ll[1];

  // if coordinates are undefined use region defaults
  if (latitude === 0 && longitude === 0) {
    latitude = regionDefaults[region].lat;
    longitude = regionDefaults[region].long;
  }

  return {
    region,
    latitude,
    longitude
  };
}

export default geolocate;
