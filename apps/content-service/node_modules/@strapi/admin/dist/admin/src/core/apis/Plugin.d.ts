import * as React from 'react';
import { immerable } from 'immer';
export interface PluginConfig extends Partial<Pick<Plugin, 'apis' | 'initializer' | 'injectionZones' | 'isReady'>> {
    name: string;
    id: string;
}
export declare class Plugin {
    [immerable]: boolean;
    apis: Record<string, unknown>;
    initializer: React.ComponentType<{
        setPlugin(pluginId: string): void;
    }> | null;
    injectionZones: Record<string, Record<string, Array<{
        name: string;
        Component: React.ComponentType;
    }>>>;
    isReady: boolean;
    name: string;
    pluginId: PluginConfig['id'];
    constructor(pluginConf: PluginConfig);
    getInjectedComponents(containerName: string, blockName: string): {
        name: string;
        Component: React.ComponentType<{}>;
    }[];
    injectComponent(containerName: string, blockName: string, component: {
        name: string;
        Component: React.ComponentType;
    }): void;
}
