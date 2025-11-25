import { Logger } from '@strapi/logger';
import { Database } from '@strapi/database';
import type { Core, Modules, UID, Schema } from '@strapi/types';
import { Container } from './container';
import { FeaturesService } from './services/features';
declare class Strapi extends Container implements Core.Strapi {
    app: any;
    isLoaded: boolean;
    internal_config: Record<string, unknown>;
    constructor(opts: StrapiOptions);
    get admin(): Core.Module;
    get EE(): boolean;
    get ee(): Core.Strapi['ee'];
    get dirs(): Core.StrapiDirectories;
    get reload(): Core.Reloader;
    get db(): Database;
    get requestContext(): Modules.RequestContext.RequestContext;
    get customFields(): Modules.CustomFields.CustomFields;
    get entityValidator(): Modules.EntityValidator.EntityValidator;
    /**
     * @deprecated `strapi.entityService` will be removed in the next major version
     */
    get entityService(): Modules.EntityService.EntityService;
    get documents(): Modules.Documents.Service;
    get features(): FeaturesService;
    get fetch(): Modules.Fetch.Fetch;
    get cron(): Modules.Cron.CronService;
    get log(): Logger;
    get startupLogger(): Core.StartupLogger;
    get eventHub(): Modules.EventHub.EventHub;
    get fs(): Core.StrapiFS;
    get server(): Modules.Server.Server;
    get telemetry(): Modules.Metrics.TelemetryService;
    get sessionManager(): Modules.SessionManager.SessionManagerService;
    get store(): Modules.CoreStore.CoreStore;
    get config(): any;
    get services(): any;
    service(uid: UID.Service): any;
    get controllers(): any;
    controller(uid: UID.Controller): any;
    get contentTypes(): Schema.ContentTypes;
    contentType(name: UID.ContentType): any;
    get components(): Schema.Components;
    get policies(): any;
    policy(name: string): any;
    get middlewares(): any;
    middleware(name: string): any;
    get plugins(): Record<string, Core.Plugin>;
    plugin(name: string): Core.Plugin;
    get hooks(): any;
    hook(name: string): any;
    get apis(): any;
    api(name: string): Core.Module;
    get auth(): any;
    get contentAPI(): any;
    get sanitizers(): any;
    get validators(): any;
    start(): Promise<this>;
    registerInternalServices(): void;
    sendStartupTelemetry(): void;
    openAdmin({ isInitialized }: {
        isInitialized: boolean;
    }): Promise<void>;
    postListen(): Promise<void>;
    /**
     * Add behaviors to the server
     */
    listen(): Promise<void>;
    stopWithError(err: unknown, customMessage?: string): never;
    stop(exitCode?: number): never;
    load(): Promise<this>;
    register(): Promise<this>;
    bootstrap(): Promise<this>;
    configureGlobalProxy(): void;
    destroy(): Promise<void>;
    runPluginsLifecycles(lifecycleName: 'register' | 'bootstrap' | 'destroy'): Promise<void>;
    runUserLifecycles(lifecycleName: 'register' | 'bootstrap' | 'destroy'): Promise<void>;
    getModel(uid: UID.ContentType): Schema.ContentType;
    getModel(uid: UID.Component): Schema.Component;
    /**
     * @deprecated Use `strapi.db.query` instead
     */
    query(uid: UID.Schema): import("@strapi/database/dist/entity-manager").Repository;
}
export interface StrapiOptions {
    appDir: string;
    distDir: string;
    autoReload?: boolean;
    serveAdminPanel?: boolean;
}
export default Strapi;
//# sourceMappingURL=Strapi.d.ts.map