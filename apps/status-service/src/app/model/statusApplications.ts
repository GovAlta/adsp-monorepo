import { StaticApplicationData, StatusServiceConfiguration } from './serviceStatus';

export class StatusApplications {
  #statusConfiguration: StatusServiceConfiguration;

  constructor(statusConfiguration: StatusServiceConfiguration) {
    this.#statusConfiguration = statusConfiguration;
  }

  get(id: string): StaticApplicationData {
    return (this.#statusConfiguration[id] as StaticApplicationData) ?? null;
  }
}
