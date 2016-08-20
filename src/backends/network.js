/**
 * @author Guillaume Leclerc <guillaume.leclerc.work@gmail.com>
 * @flow
 */
import request from 'superagent';

class NetworkBackend {
  /**
   * Create a network Backend from a network url
   *
   * @param {string} url the url of the logger server
   */
  constructor(url: string) {
    this.url = url;
  }


  /**
   * Store a message (by sending it to the logging server)
   *
   * @param {Array<object>} messages an array of message or a single message
   * @return {Promise} promise resolved when it was sent to the logging server
   */
  store(messages: Array<{[key: string]: any}>) {
    return new Promise((resolve, reject) => {
      request
        .post(this.url)
        .send(messages)
        .end((err, res) => {
          if (err) {
            reject(err);
          } else if (res.statusCode !== 200) {
            reject(res.body);
          } else {
            resolve();
          }
        });
    });
  }
}

export default NetworkBackend;
