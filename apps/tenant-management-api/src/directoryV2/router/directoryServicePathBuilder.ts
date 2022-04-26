const theRoot = 0;
const theNamespaces = 1;
const theNamespace = 2;
const theEntries = 3;
const theServices = 3;
const theService = 4;
const theApis = 5;
const theApi = 6;

export class DirectoryServicePathBuilder {
  private path: string[];

  constructor(root?: string) {
    this.path = new Array(7);
    this.path[theRoot] = root ? `/${root}` : '';
    this.path[theNamespaces] = 'namespaces';
  }

  namespace(namespace: string): DirectoryServicePathBuilder {
    this.path[theNamespace] = namespace;
    return this;
  }

  entries(namespace?: string): DirectoryServicePathBuilder {
    if (this.path[theEntries] === 'services') {
      throw Error('Illegal State');
    }
    if (namespace) {
      this.path[theNamespace] = namespace;
    }
    this.path[theEntries] = 'entries';
    return this;
  }

  services(namespace?: string): DirectoryServicePathBuilder {
    if (namespace) {
      this.namespace(namespace);
    }
    this.path[theServices] = 'services';
    return this;
  }

  service(service: string, namespace?: string): DirectoryServicePathBuilder {
    if (this.path[theServices] === 'entries') {
      throw Error('Illegal State');
    }
    this.services(namespace);
    this.path[theService] = service;
    return this;
  }

  apis(service?: string, namespace?: string): DirectoryServicePathBuilder {
    if (service) {
      this.service(service, namespace);
    }
    this.path[theApis] = 'apis';
    return this;
  }

  api(api: string, service?: string, namespace?: string): DirectoryServicePathBuilder {
    if (service) {
      this.apis(service, namespace);
    }
    this.path[theApi] = api;
    return this;
  }

  build(): string {
    const pathEnd = this.path.findIndex((e) => e === undefined);
    return this.path.slice(0, pathEnd).join('/');
  }
}
