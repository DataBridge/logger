import Resource from './Resource.js';

class Domain {
  resources = {};

  newResource(resource) {
    this.resources[resource] = new Resource();
  }

  reinitialise() {
    for (const resource of Object.keys(this.resources)) {
      this.resources[resource].reinitialise();
    }
  }
}

export default Domain;
