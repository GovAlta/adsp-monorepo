import type { CLIContext } from '../types';
export declare function tokenServiceFactory({ logger }: {
    logger: CLIContext['logger'];
}): Promise<{
    saveToken: (str: string) => Promise<void>;
    retrieveToken: () => Promise<string | undefined>;
    validateToken: (idToken: string, jwksUrl: string) => Promise<void>;
    isTokenValid: (token: string) => Promise<boolean>;
    eraseToken: () => Promise<void>;
    getValidToken: (ctx: CLIContext, loginAction: (ctx: CLIContext) => Promise<boolean>) => Promise<string | null>;
}>;
//# sourceMappingURL=token.d.ts.map