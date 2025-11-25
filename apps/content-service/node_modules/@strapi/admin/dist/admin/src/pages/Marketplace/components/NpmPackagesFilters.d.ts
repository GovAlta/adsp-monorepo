import type { Categories, Collections, FilterTypes } from '../hooks/useMarketplaceData';
import type { NpmPackageType, MarketplacePageQuery } from '../MarketplacePage';
interface NpmPackagesFiltersProps {
    handleSelectClear: (type: FilterTypes) => void;
    handleSelectChange: (update: Partial<MarketplacePageQuery>) => void;
    npmPackageType: NpmPackageType;
    possibleCategories: Partial<Record<Categories, number>>;
    possibleCollections: Partial<Record<Collections, number>>;
    query: MarketplacePageQuery;
}
declare const NpmPackagesFilters: ({ handleSelectClear, handleSelectChange, npmPackageType, possibleCategories, possibleCollections, query, }: NpmPackagesFiltersProps) => import("react/jsx-runtime").JSX.Element;
export { NpmPackagesFilters };
export type { NpmPackagesFiltersProps };
