import { AddressInfo } from 'net';
import { createSharePointMockApp } from './app';
import { defaultSeed, MockSeed } from './seed';
import { MockState } from './state';

export interface RunningSharePointMockServer {
  state: MockState;
  url: string;
  close(): Promise<void>;
}

export function startSharePointMockServer(
  port = 0,
  seed: MockSeed = defaultSeed,
): Promise<RunningSharePointMockServer> {
  const state = new MockState(seed);
  return new Promise((resolve, reject) => {
    const server = createSharePointMockApp(state).listen(port, '127.0.0.1', () => {
      const { port: boundPort } = server.address() as AddressInfo;
      resolve({
        state,
        url: `http://127.0.0.1:${boundPort}`,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
    server.on('error', reject);
  });
}
