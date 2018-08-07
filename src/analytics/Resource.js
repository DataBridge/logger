class Resource {
  url: String;
  fileSize = NaN; // in bytes
  peerLoads = []; // where 1 means loaded from peer and 0 from SoT
  IPs = [];
  devices = [];
  timestamps = [];

  constructor(url) {
    this.url = url;
  }

  reinitialise() {
    this.peerLoads = [];
    this.IPs = [];
    this.devices = [];
    this.timestamps = [];
  }
}

export default Resource;
