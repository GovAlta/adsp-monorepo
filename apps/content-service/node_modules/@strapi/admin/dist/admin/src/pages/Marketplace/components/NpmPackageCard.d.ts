import { AppInfoContextValue } from '../../../features/AppInfo';
import type { Plugin, Provider } from '../hooks/useMarketplaceData';
import type { NpmPackageType } from '../MarketplacePage';
interface NpmPackageCardProps extends Pick<AppInfoContextValue, 'useYarn'> {
    npmPackage: Plugin | Provider;
    isInstalled: boolean;
    isInDevelopmentMode: AppInfoContextValue['autoReload'];
    npmPackageType: NpmPackageType;
    strapiAppVersion: AppInfoContextValue['strapiVersion'];
}
declare const NpmPackageCard: ({ npmPackage, isInstalled, useYarn, isInDevelopmentMode, npmPackageType, strapiAppVersion, }: NpmPackageCardProps) => import("react/jsx-runtime").JSX.Element;
export { NpmPackageCard };
export type { NpmPackageCardProps };
