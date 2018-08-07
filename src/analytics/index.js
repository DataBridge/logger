import extractUsageData from './extractUsageData';
import Logger from '../Logger';

/**
* Calls analytics functions on logFile
*
* @param {string} logFilePath path to the logFile
* @param {Array} backends backends used by the logger
* @return {Promise} undefined
*/
export default function analytics(logFilePath, backends) {
  const logger = new Logger('databridge-logger', backends, 'main-logging-analytics');
  return Promise.all([
    extractUsageData(logFilePath, logger)
  ]);
}
