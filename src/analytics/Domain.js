import Resource from './Resource.js';

class Domain {
  resources = {};

  newResource(resource, url) {
    this.resources[resource] = new Resource(url);
  }

  reinitialise() {
    for (const resource of Object.keys(this.resources)) {
      this.resources[resource].reinitialise();
    }
  }
}

export default Domain;
