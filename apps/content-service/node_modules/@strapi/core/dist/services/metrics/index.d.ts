/**
 * Strapi telemetry package.
 * You can learn more at https://docs.strapi.io/developer-docs/latest/getting-started/usage-information.html
 */
import type { Core } from '@strapi/types';
declare const createTelemetryInstance: (strapi: Core.Strapi) => {
    readonly isDisabled: boolean;
    register(): void;
    bootstrap(): void;
    send(event: string, payload?: Record<string, unknown>): Promise<boolean>;
    destroy(): void;
};
export default createTelemetryInstance;
//# sourceMappingURL=index.d.ts.map