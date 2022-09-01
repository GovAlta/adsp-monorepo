import { StaticApplicationData, StatusServiceConfiguration } from './serviceStatus';

export class StatusApplications {
  #statusConfiguration: StatusServiceConfiguration;

  constructor(statusConfiguration: StatusServiceConfiguration) {
    this.#statusConfiguration = statusConfiguration;
  }

  get(id: string): StaticApplicationData {
    const app = this.#statusConfiguration[id];
    return app ? (app as StaticApplicationData) : null;
  }
}
