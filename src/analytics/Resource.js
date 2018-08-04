class Resource {
  fileSize = NaN; // in bytes
  peerLoads = 0;
  sotLoads = 0;

  reinitialise() {
    this.peerLoads = 0;
    this.sotLoads = 0;
  }
}

export default Resource;
