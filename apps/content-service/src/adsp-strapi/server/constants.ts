import { initializePlatform } from '@abgov/adsp-service-sdk';

export const ADSP_SERVICE_NAME = 'adsp';

type PromiseResultType<T> = T extends Promise<infer U> ? U : never
export type PlatformCapabilities = PromiseResultType<ReturnType<typeof initializePlatform>>;
