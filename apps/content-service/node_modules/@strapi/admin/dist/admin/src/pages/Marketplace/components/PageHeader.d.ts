import type { NpmPackageType } from '../MarketplacePage';
interface PageHeaderProps {
    isOnline?: boolean;
    npmPackageType?: NpmPackageType;
}
declare const PageHeader: ({ isOnline, npmPackageType }: PageHeaderProps) => import("react/jsx-runtime").JSX.Element;
export { PageHeader };
export type { PageHeaderProps };
