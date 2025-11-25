'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var qs = require('qs');
var useConfig = require('./useConfig.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const useModalQueryParams = (initialState)=>{
    const { trackUsage } = strapiAdmin.useTracking();
    const { config: { data: config } } = useConfig.useConfig();
    const [queryObject, setQueryObject] = React__namespace.useState({
        page: 1,
        sort: 'updatedAt:DESC',
        pageSize: 10,
        filters: {
            $and: []
        },
        ...initialState
    });
    React__namespace.useEffect(()=>{
        if (config && 'sort' in config && 'pageSize' in config) {
            setQueryObject((prevQuery)=>({
                    ...prevQuery,
                    sort: config.sort,
                    pageSize: config.pageSize
                }));
        }
    }, [
        config
    ]);
    const handleChangeFilters = (nextFilters)=>{
        if (nextFilters) {
            trackUsage('didFilterMediaLibraryElements', {
                location: 'content-manager',
                filter: Object.keys(nextFilters[nextFilters.length - 1])[0]
            });
            setQueryObject((prev)=>({
                    ...prev,
                    page: 1,
                    filters: {
                        $and: nextFilters
                    }
                }));
        }
    };
    const handleChangePageSize = (pageSize)=>{
        setQueryObject((prev)=>({
                ...prev,
                pageSize: typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize,
                page: 1
            }));
    };
    const handeChangePage = (page)=>{
        setQueryObject((prev)=>({
                ...prev,
                page
            }));
    };
    const handleChangeSort = (sort)=>{
        if (sort) {
            trackUsage('didSortMediaLibraryElements', {
                location: 'content-manager',
                sort
            });
            setQueryObject((prev)=>({
                    ...prev,
                    sort
                }));
        }
    };
    const handleChangeSearch = (_q)=>{
        if (_q) {
            setQueryObject((prev)=>({
                    ...prev,
                    _q,
                    page: 1
                }));
        } else {
            const newState = {
                page: 1
            };
            Object.keys(queryObject).forEach((key)=>{
                if (![
                    'page',
                    '_q'
                ].includes(key)) {
                    newState[key] = queryObject[key];
                }
            });
            setQueryObject(newState);
        }
    };
    const handleChangeFolder = (folder, folderPath)=>{
        setQueryObject((prev)=>({
                ...prev,
                folder: folder ?? null,
                folderPath
            }));
    };
    return [
        {
            queryObject,
            rawQuery: qs.stringify(queryObject, {
                encode: false
            })
        },
        {
            onChangeFilters: handleChangeFilters,
            onChangeFolder: handleChangeFolder,
            onChangePage: handeChangePage,
            onChangePageSize: handleChangePageSize,
            onChangeSort: handleChangeSort,
            onChangeSearch: handleChangeSearch
        }
    ];
};

exports.useModalQueryParams = useModalQueryParams;
//# sourceMappingURL=useModalQueryParams.js.map
