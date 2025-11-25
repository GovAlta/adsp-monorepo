import { SortSelectProps } from './components/SortSelect';
type NpmPackageType = 'plugin' | 'provider';
interface MarketplacePageQuery {
    collections?: string[];
    categories?: string[];
    npmPackageType?: NpmPackageType;
    page?: number;
    pageSize?: number;
    search?: string;
    sort?: SortSelectProps['sortQuery'];
}
interface TabQuery {
    plugin: MarketplacePageQuery;
    provider: MarketplacePageQuery;
}
declare const MarketplacePage: () => import("react/jsx-runtime").JSX.Element;
declare const ProtectedMarketplacePage: () => import("react/jsx-runtime").JSX.Element;
export { MarketplacePage, ProtectedMarketplacePage };
export type { NpmPackageType, MarketplacePageQuery, TabQuery };
