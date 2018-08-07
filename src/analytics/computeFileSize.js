/**
* @author MonsieurWave <tensu.wave@gmail.com>
* @flow
*/

/**
* computes size of file coming through stream
*
* @param {ReadableStream} stream The url of the file
* @return {Promise<number>} fileSize in bytes
*/
function computeFileSize(stream: ReadableStream): Promise<number> {
  return new Promise((resolve, reject) => {
    let fileSize = 0;
    stream.on('data', (chunk) => { fileSize += chunk.length; });  // add chunk size tototal fileSize
    stream.on('end', () => resolve(fileSize));
    stream.on('error', (error) => reject(error));
  });
}

export default computeFileSize;
