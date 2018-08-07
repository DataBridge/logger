/**
* @author MonsieurWave <tensu.wave@gmail.com>
* @flow
*/

import fs from 'fs';
import path from 'path';

import FileBackend from './backends/file';
import analytics from './analytics';

// Get path for a new log file
const newLogFile = (logFolder, logExtension) => {
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder);
  }
  const timestamp = new Date().getTime().toString();

  return path.resolve(logFolder, `./${timestamp}${logExtension}`);
};

// Rotate logs every X time (defined by logRotationTime)
// create newLogFile, add it to the backends and remove old file from active backends
const rotate = (backends, activeLogFile, logFolder, logFileExt, logRotationTime) => {
  setTimeout(() => {
    const newLogFilePath = newLogFile(logFolder, logFileExt);
    const newLogFileBackend = new FileBackend(path.resolve(newLogFilePath));
    backends.push(newLogFileBackend);
    backends.splice(backends.indexOf(activeLogFile), 1);

    // send old log file to analytics
    analytics(activeLogFile.file.path, backends)
    .then(() => {
      // TODO : send logFile to archive and delete it locally
    });

    activeLogFile = newLogFileBackend;
    rotate(backends, activeLogFile, logFolder, logFileExt, logRotationTime);
  }, logRotationTime);
};

export default { newLogFile, rotate };
