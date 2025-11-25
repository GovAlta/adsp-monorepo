import type { Query, FilterCondition } from '../../../shared/contracts/files';
export declare const useModalQueryParams: (initialState?: Partial<Query>) => ({
    queryObject: Query;
    rawQuery: string;
    onChangeFilters?: undefined;
    onChangeFolder?: undefined;
    onChangePage?: undefined;
    onChangePageSize?: undefined;
    onChangeSort?: undefined;
    onChangeSearch?: undefined;
} | {
    onChangeFilters: (nextFilters: FilterCondition<string>[]) => void;
    onChangeFolder: (folder: Query['folder'], folderPath: Query['folderPath']) => void;
    onChangePage: (page: Query['page']) => void;
    onChangePageSize: (pageSize: Query['pageSize']) => void;
    onChangeSort: (sort: Query['sort']) => void;
    onChangeSearch: (_q: Query['_q'] | null) => void;
    queryObject?: undefined;
    rawQuery?: undefined;
})[];
