import {
  context as otelContext,
  metrics,
  trace as otelTrace,
  ROOT_CONTEXT,
  SpanKind,
  SpanStatusCode,
} from '@opentelemetry/api';
import type { Attributes, Histogram, MeterProvider, Span } from '@opentelemetry/api';
import type { Logger } from 'winston';

// Scheduled jobs run from under a second to tens of minutes. The default OTel boundaries stop at
// 10s, which puts most real runs of a nightly sweep in the overflow bucket and leaves no way to
// see a job getting slower.
const JOB_DURATION_BOUNDARIES = [100, 500, 1000, 5000, 15000, 30000, 60000, 300000, 900000, 1800000];

// Histogram, initialized explicitly by initializeJobMetrics() to avoid race conditions.
let jobDuration: Histogram | undefined;
let isExplicitlyInitialized = false;

/**
 * Initialize scheduled job metrics with an explicit MeterProvider.
 * Call this during platform initialization so the histogram is created against the configured
 * provider before any job runs. Subsequent calls are no-ops.
 * @param meterProvider The MeterProvider to use for job instrumentation
 */
export function initializeJobMetrics(meterProvider: MeterProvider): void {
  if (!isExplicitlyInitialized) {
    jobDuration = meterProvider.getMeter('adsp-service-sdk').createHistogram('adsp.job.duration', {
      description: 'Duration of scheduled job runs recorded by the ADSP SDK.',
      unit: 'ms',
      advice: { explicitBucketBoundaries: JOB_DURATION_BOUNDARIES },
    });
    isExplicitlyInitialized = true;
  }
}

function getJobDurationHistogram(): Histogram {
  if (!jobDuration) {
    // Fallback: if not explicitly initialized, try the global provider.
    jobDuration = metrics.getMeter('adsp-service-sdk').createHistogram('adsp.job.duration', {
      description: 'Duration of scheduled job runs recorded by the ADSP SDK.',
      unit: 'ms',
      advice: { explicitBucketBoundaries: JOB_DURATION_BOUNDARIES },
    });
  }
  return jobDuration;
}

export interface InstrumentJobOptions {
  /** Logger used to report a job that threw. Failures are always recorded on the span and metric. */
  logger?: Logger;
  /**
   * Extra attributes for the job span. These are deliberately not copied onto the duration metric:
   * a span attribute is free, while a metric label multiplies the series. Per-tenant or per-run
   * detail belongs here, not in the metric's fixed name/result label set.
   */
  attributes?: Attributes;
}

/**
 * Wrap a scheduled job so each run produces a span and a duration measurement.
 *
 * The SDK deliberately does not schedule anything: it takes no scheduler dependency, so this wraps
 * the job function and leaves the cron expression to the caller.
 *
 *     schedule.scheduleJob('0 1 * * *', instrumentJob('form-lock', lockJob, { logger }));
 *
 * The job function may take the span, or reach it with trace.getActiveSpan(), to record how much
 * work a run actually did -- the thing a nightly sweep's duration alone will not tell you.
 *
 * @param name Stable job name; becomes part of the span name and a metric label, so keep it a
 *   constant rather than deriving it from per-run data
 * @param work The job to run
 * @param options Instrumentation options
 * @returns A function suitable for passing to a scheduler
 */
export function instrumentJob(
  name: string,
  work: (span: Span) => void | Promise<void>,
  { logger, attributes }: InstrumentJobOptions = {},
): () => Promise<void> {
  return () =>
    // ROOT_CONTEXT: a scheduled run is its own trace. Without it the job span can attach to
    // whatever context happened to be active when the timer fired, which grafts a nightly sweep
    // onto an unrelated request's trace and charges its time there.
    otelContext.with(ROOT_CONTEXT, () =>
      otelTrace
        .getTracer('adsp-service-sdk')
        .startActiveSpan(
          `job ${name}`,
          { kind: SpanKind.INTERNAL, attributes: { ...attributes, 'adsp.job.name': name } },
          async (span) => {
            const startedAt = process.hrtime();
            let result = 'success';

            try {
              await work(span);
              span.setStatus({ code: SpanStatusCode.OK });
            } catch (err) {
              result = 'error';
              span.recordException(err instanceof Error ? err : String(err));
              span.setStatus({ code: SpanStatusCode.ERROR, message: err instanceof Error ? err.message : String(err) });
              // Swallowed on purpose. Schedulers do not handle a rejected job, so a throwing job
              // becomes an unhandled rejection -- which on a recent Node default takes the process
              // down, meaning one bad nightly run would restart the pod. The failure is on the span
              // and counted under adsp.job.result=error, which is where it should be looked for.
              logger?.error(`Error encountered in scheduled job '${name}'. ${err}`, { context: 'ScheduledJob' });
            } finally {
              const [sec, nano] = process.hrtime(startedAt);
              getJobDurationHistogram().record(sec * 1e3 + nano * 1e-6, {
                'adsp.job.name': name,
                'adsp.job.result': result,
              });
              span.end();
            }
          },
        ),
    );
}
