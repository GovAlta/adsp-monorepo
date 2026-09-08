import type { MeterProvider } from '@opentelemetry/sdk-metrics';
import type { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import type { Logger } from 'winston';

const SIGNALS: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
const FLUSH_TIMEOUT_MS = 5000;

interface TelemetryProviders {
  tracerProvider?: NodeTracerProvider;
  meterProvider?: MeterProvider;
}

let registered = false;

async function withTimeout(work: Promise<unknown>, label: string, logger: Logger): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      work,
      new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${FLUSH_TIMEOUT_MS} ms`)), FLUSH_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    logger.warn(`Telemetry ${label} did not complete: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * Flush and shut down the telemetry providers, and arrange for the same on SIGTERM/SIGINT.
 *
 * Without this, buffered telemetry is discarded on every pod termination: the BatchSpanProcessor
 * holds spans for up to its 5s scheduled delay, and the PeriodicExportingMetricReader holds metrics
 * for up to its 60s export interval. Across a rolling deploy that is a minute of metrics missing per
 * pod, which reads as a gap in the dashboards rather than as lost data.
 *
 * Returns the shutdown function so a service can await it from its own signal handler. That matters
 * because Node runs every listener for a signal and does not wait for async ones -- a service whose
 * handler calls process.exit synchronously (file-service and tenant-management-api both do) will cut
 * this flush short. Those services should await the returned function before exiting.
 */
export function registerTelemetryShutdown(
  { tracerProvider, meterProvider }: TelemetryProviders,
  logger: Logger
): () => Promise<void> {
  const shutdown = async (): Promise<void> => {
    if (meterProvider) {
      await withTimeout(meterProvider.forceFlush(), 'metric flush', logger);
      await withTimeout(meterProvider.shutdown(), 'metric shutdown', logger);
    }

    if (tracerProvider) {
      await withTimeout(tracerProvider.forceFlush(), 'span flush', logger);
      await withTimeout(tracerProvider.shutdown(), 'span shutdown', logger);
    }
  };

  if ((tracerProvider || meterProvider) && !registered) {
    registered = true;

    for (const signal of SIGNALS) {
      process.once(signal, () => {
        // Adding a listener suppresses Node's default termination for that signal. If nothing else
        // is listening we are responsible for exiting; if something is, it owns the exit and we
        // only flush.
        const weAreTheOnlyListener = process.listenerCount(signal) === 0;

        shutdown()
          .catch((err) => logger.warn(`Telemetry shutdown failed: ${err instanceof Error ? err.message : String(err)}`))
          .finally(() => {
            if (weAreTheOnlyListener) {
              process.exit(0);
            }
          });
      });
    }
  }

  return shutdown;
}
