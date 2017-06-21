/**
 * @author Guillaume Leclerc <guillaume.leclerc.work@gmail.com>
 * @flow
 */

import { Socket } from 'net';

/**
 *
 * Backend made to talk directly to Spark Streaming
 */
class TCPBackend {
  /**
   * Create a network Backend from a network url
   *
   * @param {string} hostname the host to contact
   * @param {number} port the port to connect to
   */
  constructor(hostname, port) {
    this.socket = new Promise((resolve, reject) => {
      const client = new Socket();
      client.connect(port, hostname, () => {
        resolve(client);
      });

      client.on('error', reject);
    });
  }


  /**
   * Store a message (by sending it to the logging server)
   *
   * @param {Array<object>} messages an array of message or a single message
   * @return {Promise} promise resolved when it was sent to the logging server
   */
  store(messages: Array<{[key: string]: any}>) {
    messages.forEach(async (message) => {
      const client = await this.socket;
      client.write(JSON.stringify(message));
    });
  }
}

export default TCPBackend;
