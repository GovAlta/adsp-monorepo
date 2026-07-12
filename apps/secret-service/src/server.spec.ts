import { Express } from 'express';
import { Logger } from 'winston';
import { SecretServiceEnvironment, startSecretService } from './server';

describe('startSecretService', () => {
  const environment: SecretServiceEnvironment = {
    PORT: 3351,
    HTTPS_PORT: 8443,
    TLS_CERT: '/etc/serving-cert/tls.crt',
    TLS_KEY: '/etc/serving-cert/tls.key',
  };

  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const createHttpServerMock = () => ({
    listen: jest.fn((_port: number, callback: () => void) => callback()),
    on: jest.fn(),
  });

  const createAppMock = () => {
    const httpServer = createHttpServerMock();

    return {
      listen: jest.fn((_port: number, callback: () => void) => {
        callback();
        return httpServer;
      }),
    } as unknown as Express;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts HTTPS on 8443 when the mounted serving certificate files exist', () => {
    const app = createAppMock();
    const httpsServer = createHttpServerMock();
    const httpsModule = {
      createServer: jest.fn(() => httpsServer),
    };
    const fileSystem = {
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn((path: string) => Buffer.from(path)),
    };

    startSecretService({ app, environment, logger, fileSystem, httpsModule });

    expect(fileSystem.existsSync).toHaveBeenCalledWith('/etc/serving-cert/tls.crt');
    expect(fileSystem.existsSync).toHaveBeenCalledWith('/etc/serving-cert/tls.key');
    expect(fileSystem.readFileSync).toHaveBeenCalledWith('/etc/serving-cert/tls.crt');
    expect(fileSystem.readFileSync).toHaveBeenCalledWith('/etc/serving-cert/tls.key');
    expect(httpsModule.createServer).toHaveBeenCalledWith(
      {
        cert: Buffer.from('/etc/serving-cert/tls.crt'),
        key: Buffer.from('/etc/serving-cert/tls.key'),
      },
      app,
    );
    expect(httpsServer.listen).toHaveBeenCalledWith(8443, expect.any(Function));
    expect(app.listen).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      'Secret service listening on HTTPS :8443 (TLS: /etc/serving-cert/tls.crt)',
    );
  });

  it('falls back to HTTP on the local development port when the serving certificate files are missing', () => {
    const app = createAppMock();
    const httpsModule = {
      createServer: jest.fn(),
    };
    const fileSystem = {
      existsSync: jest.fn(() => false),
      readFileSync: jest.fn(),
    };

    startSecretService({ app, environment, logger, fileSystem, httpsModule });

    expect(httpsModule.createServer).not.toHaveBeenCalled();
    expect(fileSystem.readFileSync).not.toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalledWith(3351, expect.any(Function));
    expect(logger.warn).toHaveBeenCalledWith(
      'TLS certificate not found at /etc/serving-cert/tls.crt; starting HTTP server on :3351. This should only occur in local development.',
    );
    expect(logger.info).toHaveBeenCalledWith('Secret service listening on HTTP :3351');
  });
});
