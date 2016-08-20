/**
 * @author Guillaume Leclerc <guillaume.leclerc.work@gmail.com>
 * @flow
 */

import Chance from 'chance';

const randomGenerator = new Chance();

/**
 * Allow to log things to a given backend
 */
class Logger {
  /**
   * Create a new looger
   *
   * @param {string} application th name of the application bridge
   * @param {function} backend the function responsible to store the log entry
   * @param {string} identity the identity of the person logging things
   */
  constructor(application,
    backend,
    identity = randomGenerator.guid()) {
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
   * @return {undefined}
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
    this.backend.store(packet);
  }
}

export default Logger;
