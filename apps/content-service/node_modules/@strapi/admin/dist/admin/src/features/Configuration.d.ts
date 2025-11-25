import * as React from 'react';
import { UpdateProjectSettings } from '../../../shared/contracts/admin';
import { ConfigurationLogo } from '../services/admin';
import type { StrapiApp } from '../StrapiApp';
interface UpdateProjectSettingsBody {
    authLogo: ((UpdateProjectSettings.Request['body']['authLogo'] | ConfigurationLogo['custom']) & {
        rawFile?: File;
    }) | null;
    menuLogo: ((UpdateProjectSettings.Request['body']['menuLogo'] | ConfigurationLogo['custom']) & {
        rawFile?: File;
    }) | null;
}
interface ConfigurationContextValue {
    logos: {
        auth: ConfigurationLogo;
        menu: ConfigurationLogo;
    };
    showReleaseNotification: boolean;
    updateProjectSettings: (body: UpdateProjectSettingsBody) => Promise<void>;
}
declare const ConfigurationContextProvider: {
    (props: ConfigurationContextValue & {
        children: React.ReactNode;
    }): JSX.Element;
    displayName: string;
}, useConfiguration: (consumerName: string) => ConfigurationContextValue;
interface ConfigurationProviderProps {
    children: React.ReactNode;
    defaultAuthLogo: StrapiApp['configurations']['authLogo'];
    defaultMenuLogo: StrapiApp['configurations']['menuLogo'];
    showReleaseNotification?: boolean;
}
declare const ConfigurationProvider: ({ children, defaultAuthLogo, defaultMenuLogo, showReleaseNotification, }: ConfigurationProviderProps) => import("react/jsx-runtime").JSX.Element;
export { ConfigurationContextProvider as _internalConfigurationContextProvider, ConfigurationProvider, useConfiguration, };
export type { ConfigurationProviderProps, ConfigurationContextValue, ConfigurationLogo, UpdateProjectSettingsBody, };
