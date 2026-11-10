import type { Server as HttpServer } from 'http';

const IDLE_SWEEP_MS = 100;

export interface ServerLifecycle {
  readonly draining: boolean;
  beginDrain(): void;
}

export function createLifecycle(): ServerLifecycle {
  let draining = false;
  return {
    get draining() {
      return draining;
    },
    beginDrain() {
      draining = true;
    },
  };
}

export interface GracefulShutdownOptions {
  httpServer: HttpServer;
  lifecycle: ServerLifecycle;
  /** How long to keep serving after readiness fails, while the router stops sending traffic. */
  delayMs: number;
  /** Hard deadline from the signal to exit, even if a request never finishes. */
  timeoutMs: number;
  flush?: () => Promise<void>;
  exit: (code: number) => void;
  log?: (message: string) => void;
}

export function createGracefulShutdown({
  httpServer,
  lifecycle,
  delayMs,
  timeoutMs,
  flush = () => Promise.resolve(),
  exit,
  log = (message) => console.error(`[adsp-sdk-mcp-server] ${message}`),
}: GracefulShutdownOptions): () => void {
  let started = false;
  let exited = false;
  let deadline: NodeJS.Timeout | undefined;
  const exitOnce = (code: number) => {
    if (!exited) {
      exited = true;
      clearTimeout(deadline);
      exit(code);
    }
  };

  return () => {
    if (started) {
      return;
    }
    started = true;
    lifecycle.beginDrain();
    log(`Shutting down: readiness off, draining for up to ${timeoutMs} ms.`);
    deadline = setTimeout(() => {
      log('Shutdown deadline reached with requests still running; exiting.');
      exitOnce(1);
    }, timeoutMs).unref();

    setTimeout(() => {
      // close() only drops connections idle right now; one whose request finishes later stays open as keep-alive.
      const closeIdle = setInterval(() => httpServer.closeIdleConnections(), IDLE_SWEEP_MS).unref();
      httpServer.close(() => {
        clearInterval(closeIdle);
        flush()
          .catch(() => undefined)
          .then(() => exitOnce(0));
      });
      httpServer.closeIdleConnections();
    }, delayMs).unref();
  };
}
