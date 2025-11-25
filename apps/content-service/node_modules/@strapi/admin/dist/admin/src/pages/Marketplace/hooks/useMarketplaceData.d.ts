import type { MarketplacePageQuery, NpmPackageType, TabQuery } from '../MarketplacePage';
interface UseMarketplaceDataParams {
    npmPackageType: NpmPackageType;
    debouncedSearch: string;
    query?: MarketplacePageQuery;
    tabQuery: TabQuery;
    strapiVersion?: string | null;
}
type Collections = 'Verified' | 'Made by the community' | 'Made by Strapi' | 'Made by official partners';
type Categories = 'Custom fields' | 'Deployment' | 'Monitoring';
type FilterTypes = 'categories' | 'collections';
interface Plugin {
    id: string;
    attributes: {
        name: string;
        description: string;
        slug: string;
        npmPackageName: string;
        npmPackageUrl: string;
        npmDownloads: number;
        repositoryUrl: string;
        githubStars: number;
        logo: {
            url: string;
        };
        developerName: string;
        validated: boolean;
        madeByStrapi: boolean;
        strapiCompatibility: string;
        submissionDate: string;
        collections: Collections[];
        categories: Categories[];
        strapiVersion: string;
        screenshots: Array<{
            url: string;
        }>;
    };
}
interface Provider {
    id: string;
    attributes: {
        name: string;
        description: string;
        slug: string;
        npmPackageName: string;
        npmPackageUrl: string;
        npmDownloads: number;
        repositoryUrl: string;
        githubStars: number;
        pluginName: string;
        logo: {
            url: string;
        };
        developerName: string;
        validated: boolean;
        madeByStrapi: boolean;
        strapiCompatibility: string;
        strapiVersion?: never;
        submissionDate: string;
        collections: Collections[];
    };
}
interface MarketplaceMeta {
    collections: Record<Collections, number>;
    pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
    };
}
interface MarketplaceResponse<TData extends Plugin | Provider> {
    data: TData[];
    meta: TData extends Provider ? MarketplaceMeta : MarketplaceMeta & {
        categories: Record<Categories, number>;
    };
}
declare function useMarketplaceData({ npmPackageType, debouncedSearch, query, tabQuery, strapiVersion, }: UseMarketplaceDataParams): {
    pluginsResponse: MarketplaceResponse<Plugin> | null | undefined;
    providersResponse: MarketplaceResponse<Provider> | undefined;
    pluginsStatus: "success" | "loading" | "error" | "idle";
    providersStatus: "success" | "loading" | "error" | "idle";
    possibleCollections: {};
    possibleCategories: {};
    pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
    } | undefined;
};
export { useMarketplaceData };
export type { MarketplaceResponse, Plugin, Provider, MarketplaceMeta, Collections, Categories, FilterTypes, UseMarketplaceDataParams, };
