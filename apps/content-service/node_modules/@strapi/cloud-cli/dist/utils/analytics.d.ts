import type { CLIContext, CloudApiService, TrackPayload } from '../types';
declare const trackEvent: (ctx: CLIContext, cloudApiService: CloudApiService, eventName: string, eventData: TrackPayload) => Promise<void>;
export { trackEvent };
//# sourceMappingURL=analytics.d.ts.map