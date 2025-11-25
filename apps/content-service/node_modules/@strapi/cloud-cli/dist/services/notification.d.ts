import type { CLIContext, CloudCliConfig } from '../types';
export declare function notificationServiceFactory({ logger }: CLIContext): (url: string, token: string, cliConfig: CloudCliConfig) => {
    waitForEnvironmentCreation: (environmentName: string) => Promise<unknown>;
    close: () => void;
};
//# sourceMappingURL=notification.d.ts.map