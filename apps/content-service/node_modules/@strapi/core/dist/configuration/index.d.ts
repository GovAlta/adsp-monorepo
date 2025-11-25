import _ from 'lodash';
import type { StrapiOptions } from '../Strapi';
export declare const loadConfiguration: (opts: StrapiOptions) => {
    launchedAt: number;
    autoReload: boolean;
    environment: string | undefined;
    uuid: any;
    installId: any;
    packageJsonStrapi: Pick<any, string | number | symbol>;
    info: any;
    admin: {
        serveAdminPanel: boolean;
    };
} & {
    server: {
        host: string;
        port: number;
        proxy: false;
        cron: {
            enabled: false;
        };
        admin: {
            autoOpen: false;
        };
        dirs: {
            public: string;
        };
        transfer: {
            remote: {
                enabled: true;
            };
        };
        logger: {
            updates: {
                enabled: true;
            };
            startup: {
                enabled: true;
            };
        };
    };
    admin: {};
    api: {
        rest: {
            prefix: string;
        };
    };
} & _.Omit<Record<string, unknown>, "plugins"> & Record<string, unknown>;
//# sourceMappingURL=index.d.ts.map