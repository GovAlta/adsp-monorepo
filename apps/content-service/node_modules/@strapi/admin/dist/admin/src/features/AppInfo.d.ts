/// <reference types="react" />
interface AppInfoContextValue {
    autoReload?: boolean;
    communityEdition?: boolean;
    currentEnvironment?: string;
    dependencies?: Record<string, string>;
    latestStrapiReleaseTag?: string;
    nodeVersion?: string;
    projectId?: string | null;
    shouldUpdateStrapi?: boolean;
    strapiVersion?: string | null;
    useYarn?: boolean;
    userId?: string;
}
declare const AppInfoProvider: {
    (props: AppInfoContextValue & {
        children: import("react").ReactNode;
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
}, useAppInfo: <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: AppInfoContextValue) => Selected, shouldThrowOnMissingContext?: ShouldThrow | undefined) => ShouldThrow extends true ? Selected : Selected | undefined;
export { AppInfoProvider, useAppInfo };
export type { AppInfoContextValue };
