/**
 * @author Guillaume Leclerc <guillaume.leclerc.work@gmail.com>
 * @flow
 */

import fs from 'mz/fs';

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
   * @param {Array<object>} messages the messages to persist
   * @return {Promise} a promise when the writing is done
   */
  store(messages) {
    let mergedMessages;
    try {
      mergedMessages = messages.map(JSON.stringify)
        .join('\n');
    } catch (e) {
      console.error(e);
      console.log(messages);
      mergedMessages = [JSON.stringify({ error: e })];
    }

    return this.file.write(`${mergedMessages}\n`);
  }
}

export default FileBackend;
