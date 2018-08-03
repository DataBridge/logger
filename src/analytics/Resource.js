class Resource {
  fileSize = NaN;
  peerLoads = 0;
  sotLoads = 0;

  reinitialise() {
    this.peerLoads = 0;
    this.sotLoads = 0;
  }
}

export default Resource;
