/**
 * @author Guillaume Leclerc <guillaume.leclerc.work@gmail.com>
 * @flow
 */

import uuid from 'uuid';
import { debounce } from 'lodash';

/**
 * The max size of the logging buffer.
 *
 * If it reach that size it should be directly forwarded to the backends
 *
 * @constant
 */
const MAX_BUFFER_SIZE = 100;

/**
 * Allow to log things to a given backend
 */
class Logger {

  buffer: Array<{[key: string]: any}> = [];

  /**
   * Create a new looger
   *
   * @param {string} application the name of the application bridge
   * @param {Array | object} backends list of backends to use
   * @param {string} identity the identity of the person logging things
   * @param {number} aggregationTime the time frame to aggregate all the logs in a single block
   */
  constructor(application,
    backends,
    identity = uuid.v4(),
    aggregationTime = 500
  ) {
    this.application = application;
    this.identity = identity;
    this.backends = backends;
    if (!Array.isArray(this.backends)) {
      this.backends = [this.backends];
    }
    this.drainDebounced = debounce(this.drain, aggregationTime, {
      maxWait: this.aggregationTime
    });
  }

  /**
   * Send and entire block of messages at once
   *
   * Also empties the buffer
   *
   * @return {undefined} Nothing to return
   */
  drain = () => {
    // Store for each backend
    this.backends.forEach(backend => {
      backend.store(this.buffer);
    });
    this.buffer = [];
  }

  /**
   * Log an event and pass it to the backend
   *
   * @param {string} eventId the unique id for this kind of event
   * @param {object} details more info about the event
   * @param {string} level the level of the log entry
   * @return {Promise} the promise when the data has been successfully sent to the backend
   */
  log(eventId, details = {}, level = 'info') {
    const packet = {
      identity: this.identity,
      application: this.application,
      timestamp: Date.now(),
      eventId,
      details,
      level
    };
    this.buffer.push(packet);
    if (this.buffer.length > MAX_BUFFER_SIZE) {
      this.drain();
    } else {
      this.drainDebounced();
    }
  }
}

export default Logger;
