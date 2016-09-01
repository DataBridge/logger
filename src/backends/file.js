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
  }

  /**
   * Store a message/packet using this backend
   *
   * @param {Array<object>} messages the messages to persist
   * @return {Promise} a promise when the writing is done
   */
  store(messages) {
    return Promise.all(messages.map(
      message => this.file.write(`${JSON.stringify(message)}\n`)
    ));
  }
}

export default FileBackend;
