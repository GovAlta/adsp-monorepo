export class DirectoryServicePathBuilder {
  private path: string[];
  private readonly theRoot = 0;
  private readonly theNamespaces = 1;
  private readonly theNamespace = 2;
  private readonly theEntries = 3;
  private readonly theServices = 3;
  private readonly theService = 4;
  private readonly theApis = 5;
  private readonly theApi = 6;

  constructor(root?: string) {
    this.path = new Array(7);
    this.path[this.theRoot] = root ? `/${root}` : '';
    this.path[this.theNamespaces] = 'namespaces';
  }

  namespace = (namespace: string): DirectoryServicePathBuilder => {
    this.path[this.theNamespace] = namespace;
    return this;
  };

  entries = (namespace?: string): DirectoryServicePathBuilder => {
    if (this.path[this.theEntries] === 'services') {
      throw Error('Illegal State');
    }
    if (namespace) {
      this.path[this.theNamespace] = namespace;
    }
    this.path[this.theEntries] = 'entries';
    return this;
  };

  services = (namespace?: string): DirectoryServicePathBuilder => {
    if (namespace) {
      this.namespace(namespace);
    }
    this.path[this.theServices] = 'services';
    return this;
  };

  service = (service: string, namespace?: string): DirectoryServicePathBuilder => {
    if (this.path[this.theServices] === 'entries') {
      throw Error('Illegal State');
    }
    this.services(namespace);
    this.path[this.theService] = service;
    return this;
  };

  apis = (service?: string, namespace?: string): DirectoryServicePathBuilder => {
    if (service) {
      this.service(service, namespace);
    }
    this.path[this.theApis] = 'apis';
    return this;
  };

  api = (api: string, service?: string, namespace?: string): DirectoryServicePathBuilder => {
    if (service) {
      this.apis(service, namespace);
    }
    this.path[this.theApi] = api;
    return this;
  };

  build(): string {
    const pathEnd = this.path.findIndex((e) => e === undefined);
    return this.path.slice(0, pathEnd).join('/');
  }
}
