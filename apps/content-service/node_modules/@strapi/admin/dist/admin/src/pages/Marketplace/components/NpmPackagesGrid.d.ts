import { AppInfoContextValue } from '../../../features/AppInfo';
import { NpmPackageCardProps } from './NpmPackageCard';
import type { Plugin, Provider } from '../hooks/useMarketplaceData';
interface NpmPackagesGridProps extends Pick<NpmPackageCardProps, 'npmPackageType' | 'useYarn'> {
    debouncedSearch: string;
    installedPackageNames: string[];
    isInDevelopmentMode: AppInfoContextValue['autoReload'];
    npmPackages?: Array<Plugin | Provider>;
    status: 'idle' | 'loading' | 'error' | 'success';
    strapiAppVersion?: NpmPackageCardProps['strapiAppVersion'];
}
declare const NpmPackagesGrid: ({ status, npmPackages, installedPackageNames, useYarn, isInDevelopmentMode, npmPackageType, strapiAppVersion, debouncedSearch, }: NpmPackagesGridProps) => import("react/jsx-runtime").JSX.Element;
export { NpmPackagesGrid };
