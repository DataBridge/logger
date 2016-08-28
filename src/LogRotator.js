/**
 * @author MonsieurWave <tensu.wave@gmail.com>
 * @flow
 */

module.exports = {
 /**
  * A daily LogRotator function
  * Creates a new log for every day
  *
  * @param {String} filename the name of the file to be rotated
  * @return {String} rotatedFilename filename with date extension (_dd-mm-yy)
  */
  daily: (filename) => {
    const currentDate = new Date(Date.now());
    let dd = currentDate.getDate();
    let mm = currentDate.getMonth() + 1;
    const yy = currentDate.getFullYear();

    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }

    const rotatedFilename = filename + '_' + dd + '-' + mm + '-' + yy;
    return rotatedFilename;
  }
};
