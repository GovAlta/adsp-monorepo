/// <reference types="react" />
import { RBAC } from '../core/apis/rbac';
import { Router } from '../core/apis/router';
import type { StrapiApp } from '../StrapiApp';
interface StrapiAppContextValue extends Pick<StrapiApp, 'customFields' | 'getPlugin' | 'getAdminInjectedComponents' | 'plugins' | 'runHookParallel' | 'runHookSeries' | 'widgets'>, Pick<Router, 'menu' | 'settings'> {
    components: StrapiApp['library']['components'];
    fields: StrapiApp['library']['fields'];
    rbac: RBAC;
    runHookWaterfall: <TData>(name: Parameters<StrapiApp['runHookWaterfall']>[0], initialValue: TData) => TData;
}
declare const StrapiAppProvider: {
    (props: StrapiAppContextValue & {
        children: import("react").ReactNode;
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
}, useStrapiApp: <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: StrapiAppContextValue) => Selected, shouldThrowOnMissingContext?: ShouldThrow | undefined) => ShouldThrow extends true ? Selected : Selected | undefined;
export { StrapiAppProvider, useStrapiApp };
export type { StrapiAppContextValue };
