/**
* @author MonsieurWave <tensu.wave@gmail.com>
* @flow
*/

import http from 'http';
import https from 'https';
import url from 'url';

const adapters = { http, https };

/**
* download file and return promise of content
*
* @param {string} inputUrl The url of the file
* @param {Object} logger logger instance used for logging in the analytics
* @return {Promise<ReadableStream>} promise of stream of data in file
*/
function download(inputUrl: string, logger): Promise<ReadableStream> {
  return new Promise((resolve, reject) => {   // promisify the stream
    // extract protocol from url
    const protocol = url.parse(inputUrl).protocol.slice(0, -1);

    adapters[protocol] // choose between http and https
    .get(inputUrl, (res) => {
      const { statusCode } = res;

      if (statusCode >= 400) {    // check if no error occured
        const err = new Error('Request Failed.\n' +
                      `Status Code: ${statusCode}`);
        logger.log('file-download-failed', { inputUrl, err }, 'error');
        return reject(err);
      }

      logger.log('file-download-successful', { inputUrl });
      return resolve(res);    // resolves with stream of file
    })
    .on('error', (err) => {
      logger.log('file-download-failed', { inputUrl, err }, 'error');
    });
  });
}

export default download;
