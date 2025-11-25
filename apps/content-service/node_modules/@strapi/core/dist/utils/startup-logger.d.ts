import type { Core } from '@strapi/types';
export declare const createStartupLogger: (app: Core.Strapi) => {
    logStats(): void;
    logFirstStartupMessage(): void;
    logDefaultStartupMessage(): void;
    logStartupMessage({ isInitialized }: {
        isInitialized: boolean;
    }): void;
};
//# sourceMappingURL=startup-logger.d.ts.map