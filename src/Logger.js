/**
 * @author Guillaume Leclerc <guillaume.leclerc.work@gmail.com>
 * @flow
 */

import uuid from 'uuid';

/**
 * Allow to log things to a given backend
 */
class Logger {
  /**
   * Create a new looger
   *
   * @param {string} application the name of the application bridge
   * @param {function} backend the function responsible to store the log entry
   * @param {string} identity the identity of the person logging things
   */
  constructor(application,
    backend,
    identity = uuid.v4()) {
    this.application = application;
    this.identity = identity;
    this.backend = backend;
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
    return this.backend.store([packet]);
  }
}

export default Logger;
