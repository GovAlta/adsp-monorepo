'use strict';

var React = require('react');
var qs = require('qs');
var reactRouterDom = require('react-router-dom');

const useSearch = ()=>{
    const { search } = reactRouterDom.useLocation();
    return React.useMemo(()=>search, [
        search
    ]);
};
const useQueryParams = (initialParams)=>{
    const search = useSearch();
    const navigate = reactRouterDom.useNavigate();
    const query = React.useMemo(()=>{
        // TODO: investigate why sometimes we're getting the search with a leading `?` and sometimes not.
        const searchQuery = search.startsWith('?') ? search.slice(1) : search;
        if (!search && initialParams) {
            return initialParams;
        }
        return {
            ...initialParams,
            ...qs.parse(searchQuery)
        };
    }, [
        search,
        initialParams
    ]);
    const setQuery = React.useCallback((nextParams, method = 'push', replace = false)=>{
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
            search: qs.stringify(nextQuery, {
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

exports.useQueryParams = useQueryParams;
//# sourceMappingURL=useQueryParams.js.map
