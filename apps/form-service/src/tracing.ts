// Registers OpenTelemetry auto-instrumentation for this service's data store.
//
// MUST be the first import in main.ts. The instrumentation patches mongoose by hooking `require`,
// which only works if it runs before mongoose is loaded -- and `./mongo` is a top-level import of
// main.ts, so mongoose is pulled in during the import phase, not inside main().
//
// No TracerProvider is passed. At this point initializePlatform has not run, so the instrumentation
// caches the API's ProxyTracer, which resolves its delegate lazily on every startSpan. Once
// initializePlatform calls tracerProvider.register(), spans start flowing; before that they are
// no-ops, so this is also safe when tracing is disabled.
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { MongooseInstrumentation } from '@opentelemetry/instrumentation-mongoose';

registerInstrumentations({
  instrumentations: [
    new MongooseInstrumentation({
      // Statements can carry form content, which may include personal information. Record the
      // operation and collection only -- the span name and db attributes are enough to see which
      // query is slow.
      dbStatementSerializer: () => undefined,
    }),
  ],
});
