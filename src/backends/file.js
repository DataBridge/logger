/**
* @author Guillaume Leclerc <guillaume.leclerc.work@gmail.com>
* @flow
*/

import stream from 'logrotate-stream';

/**
* A backend that writes the logs to a single file
*
* It does not support log rotation
*/
class FileBackend {
  /**
  * Create a new FileBackend from the path of the file to write
  *
  * @param {string} filename the file where we should store the file
  * @param {string} filesize size of the file before rotation
  */
  constructor(filename, filesize) {
    this.file = stream({
      file: filename,
      size: filesize,
      keep: Infinity,
      compress: true
    });
    this.file.on('error',(e)=>{console.log(e)})
  }

  /**
  * Store a message/packet using this backend
  *
  * @param {Array<object>} messages the messages to persist
  * @return {Promise} a promise when the writing is done
  */
  store(messages) {
    const allMessages = messages.map(JSON.stringify).join('\n') + 'lalala';
    const prem = new Promise((resolve, reject) => {
      this.file.write(allMessages, 'utf8', (e) => {
        if (e) {
          console.log(e);
          return reject();
        }
        console.log("no e");
        return resolve();
      });
    });

    prem.then(()=>console.log("lel"));

    return Promise.all(messages.map(
      message => this.file.write(`\n`)
    ));
  }
}

export default FileBackend;
