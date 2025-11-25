import { useMemo, useCallback } from 'react';
import { parse, stringify } from 'qs';
import { useNavigate, useLocation } from 'react-router-dom';

const useSearch = ()=>{
    const { search } = useLocation();
    return useMemo(()=>search, [
        search
    ]);
};
const useQueryParams = (initialParams)=>{
    const search = useSearch();
    const navigate = useNavigate();
    const query = useMemo(()=>{
        // TODO: investigate why sometimes we're getting the search with a leading `?` and sometimes not.
        const searchQuery = search.startsWith('?') ? search.slice(1) : search;
        if (!search && initialParams) {
            return initialParams;
        }
        return {
            ...initialParams,
            ...parse(searchQuery)
        };
    }, [
        search,
        initialParams
    ]);
    const setQuery = useCallback((nextParams, method = 'push', replace = false)=>{
        let nextQuery = {
            ...query
        };
        if (method === 'remove') {
            Object.keys(nextParams).forEach((key)=>{
                if (Object.prototype.hasOwnProperty.call(nextQuery, key)) {
                    // @ts-expect-error – this is fine, if you want to fix it, please do.
                    delete nextQuery[key];
                }
            });
        } else {
            nextQuery = {
                ...query,
                ...nextParams
            };
        }
        navigate({
            search: stringify(nextQuery, {
                encode: false
            })
        }, {
            replace
        });
    }, [
        navigate,
        query
    ]);
    return [
        {
            query,
            rawQuery: search
        },
        setQuery
    ];
};

export { useQueryParams };
//# sourceMappingURL=useQueryParams.mjs.map
