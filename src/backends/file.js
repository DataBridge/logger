/**
 * @author Guillaume Leclerc <guillaume.leclerc.work@gmail.com>
 * @flow
 */

import fs from 'mz/fs';

/**
 * A backend that write the logs to a single file
 *
 * It does not support log rotation
 */
class FileBackend {
  /**
   * Create a new FileBackend from the path of the file to write
   *
   * @param {string} filename the file where we should store the file
   */
  constructor(filename) {
    this.file = fs.createWriteStream(filename, {
      flags: 'a+',
      defaultEncoding: 'utf8',
      autoClose: true
    });
  }

  /**
   * Store a message/packet using this backend
   *
   * @param {object} message the message to persist
   * @return {undefined}
   */
  store(message) {
    return this.file.write(`${JSON.stringify(message)}\n`);
  }
}

export default FileBackend;
