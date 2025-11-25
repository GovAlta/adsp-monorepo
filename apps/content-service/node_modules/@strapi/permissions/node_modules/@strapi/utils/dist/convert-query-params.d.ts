import { Model } from './types';
type SortOrder = 'asc' | 'desc';
export interface SortMap {
    [key: string]: SortOrder | SortMap;
}
export interface SortParamsObject {
    [key: string]: SortOrder | SortParamsObject;
}
type SortParams = string | string[] | SortParamsObject | SortParamsObject[];
type FieldsParams = string | string[];
type FiltersParams = unknown;
export interface PopulateAttributesParams {
    [key: string]: boolean | PopulateObjectParams;
}
export interface PopulateObjectParams {
    sort?: SortParams;
    fields?: FieldsParams;
    filters?: FiltersParams;
    populate?: string | string[] | PopulateAttributesParams;
    on?: PopulateAttributesParams;
    count?: boolean;
    ordering?: unknown;
    _q?: string;
    limit?: number | string;
    start?: number | string;
    page?: number | string;
    pageSize?: number | string;
}
type PopulateParams = string | string[] | PopulateAttributesParams;
export interface Params {
    sort?: SortParams;
    fields?: FieldsParams;
    filters?: FiltersParams;
    populate?: PopulateParams;
    count?: boolean;
    ordering?: unknown;
    _q?: string;
    limit?: number | string;
    start?: number | string;
    page?: number | string;
    pageSize?: number | string;
    status?: 'draft' | 'published';
}
type FiltersQuery = (options: {
    meta: Model;
}) => WhereQuery | undefined;
type OrderByQuery = SortMap | SortMap[];
type SelectQuery = string | string[];
export interface WhereQuery {
    [key: string]: any;
}
type PopulateQuery = boolean | string[] | {
    [key: string]: PopulateQuery;
};
export interface Query {
    orderBy?: OrderByQuery;
    select?: SelectQuery;
    where?: WhereQuery;
    filters?: FiltersQuery;
    populate?: PopulateQuery;
    count?: boolean;
    ordering?: unknown;
    _q?: string;
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
}
interface TransformerOptions {
    getModel: (uid: string) => Model | undefined;
}
declare const createTransformer: ({ getModel }: TransformerOptions) => {
    private_convertSortQueryParams: (sortQuery: SortParams) => OrderByQuery;
    private_convertStartQueryParams: (startQuery: unknown) => number;
    private_convertLimitQueryParams: (limitQuery: unknown) => number | undefined;
    private_convertPopulateQueryParams: (populate: PopulateParams, schema?: Model, depth?: number) => PopulateQuery;
    private_convertFiltersQueryParams: (filters: FiltersParams, schema?: Model) => WhereQuery;
    private_convertFieldsQueryParams: (fields: FieldsParams, schema?: Model, depth?: number) => SelectQuery | undefined;
    transformQueryParams: (uid: string, params: Params) => Query;
};
export { createTransformer };
//# sourceMappingURL=convert-query-params.d.ts.map