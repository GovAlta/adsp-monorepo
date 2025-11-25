import type { Core } from '@strapi/types';
import { RawModule, Module } from '../domain/module';
type ModuleMap = {
    [namespace: string]: Module;
};
declare const modulesRegistry: (strapi: Core.Strapi) => {
    get(namespace: string): Module;
    getAll(prefix?: string): Partial<ModuleMap>;
    add(namespace: string, rawModule: RawModule): Module;
    bootstrap(): Promise<void>;
    register(): Promise<void>;
    destroy(): Promise<void>;
};
export default modulesRegistry;
//# sourceMappingURL=modules.d.ts.map