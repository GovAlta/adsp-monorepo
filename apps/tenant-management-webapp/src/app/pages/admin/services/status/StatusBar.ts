import { EndpointStatusEntry, ServiceStatusEndpoint } from '@store/status/models';

const barLength = 30;
const millisecondsPerMinute = 1000 * 60;

export class StatusBar {
  #entries: EndpointStatusEntry[];
  #endpoint: ServiceStatusEndpoint;
  #t0: number;

  constructor(endpoint: ServiceStatusEndpoint, entries: EndpointStatusEntry[]) {
    this.#entries = entries;
    this.#endpoint = endpoint;
    this.#t0 = StatusBar.toMinute(new Date().getTime()) - barLength;
  }

  getEntries = (): EndpointStatusEntry[] => {
    const statusBar: EndpointStatusEntry[] = [];
    // #entries is sparse, so to make sure we have valid entries initialize
    // the array with the default.
    for (let i = 0; i < barLength; i++) {
      statusBar.push(this.#getDefaultEntry(this.#t0 + i * millisecondsPerMinute));
    }
    for (let i = 0; i < this.#entries.length; i++) {
      // if there is more than one entry in a bucket, just take the last one.
      statusBar[this.#getBucketIndex(this.#entries[i].timestamp)] = this.#entries[i];
    }
    return statusBar;
  };

  // Default to status check turned off.
  #getDefaultEntry = (timestamp: number): EndpointStatusEntry => ({
    ok: false,
    timestamp,
    status: 'n/a',
    url: this.#endpoint.url,
    responseTime: -1,
  });

  #getBucketIndex = (timestamp: number): number => {
    return StatusBar.toMinute(timestamp) - this.#t0 - 1;
  };

  private static toMinute = (timestamp: number): number => {
    return Math.floor(timestamp / (1000 * 60));
  };
}
