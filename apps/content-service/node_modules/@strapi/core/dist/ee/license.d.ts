import type { Core } from '@strapi/types';
interface LicenseInfo {
    type: 'bronze' | 'silver' | 'gold';
    isTrial: boolean;
    expireAt?: string;
    seats?: number;
    features?: Array<{
        name: string;
        options?: Record<string, unknown>;
    }>;
}
declare const LICENSE_REGISTRY_URI = "https://license.strapi.io";
declare class LicenseCheckError extends Error {
    shouldFallback: boolean;
    constructor(message: string, shouldFallback?: boolean);
}
declare const readLicense: (directory: string) => string | undefined;
declare const verifyLicense: (license: string) => LicenseInfo;
declare const fetchLicense: ({ strapi }: {
    strapi: Core.Strapi;
}, key: string, projectId: string) => Promise<any>;
export { readLicense, verifyLicense, fetchLicense, LicenseCheckError, LICENSE_REGISTRY_URI };
//# sourceMappingURL=license.d.ts.map