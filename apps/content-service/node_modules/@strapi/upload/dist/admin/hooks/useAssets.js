'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactQuery = require('react-query');
var pluginId = require('../pluginId.js');

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

const useAssets = ({ skipWhen = false, query = {} } = {})=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { notifyStatus } = designSystem.useNotifyAT();
    const { get } = strapiAdmin.useFetchClient();
    const { folderPath, _q, ...paramsExceptFolderAndQ } = query;
    let params;
    if (_q) {
        params = {
            ...paramsExceptFolderAndQ,
            _q: encodeURIComponent(_q)
        };
    } else {
        params = {
            ...paramsExceptFolderAndQ,
            filters: {
                $and: [
                    ...paramsExceptFolderAndQ?.filters?.$and ?? [],
                    {
                        folderPath: {
                            $eq: folderPath ?? '/'
                        }
                    }
                ]
            }
        };
    }
    const { data, error, isLoading } = reactQuery.useQuery([
        pluginId.pluginId,
        'assets',
        params
    ], async ()=>{
        const { data } = await get('/upload/files', {
            params
        });
        return data;
    }, {
        enabled: !skipWhen,
        staleTime: 0,
        cacheTime: 0,
        select (data) {
            if (data?.results && Array.isArray(data.results)) {
                return {
                    ...data,
                    results: data.results/**
               * Filter out assets that don't have a name.
               * So we don't try to render them as assets
               * and get errors.
               */ .filter((asset)=>asset.name).map((asset)=>({
                            ...asset,
                            /**
                 * Mime and ext cannot be null in the front-end because
                 * we expect them to be strings and use the `includes` method.
                 */ mime: asset.mime ?? '',
                            ext: asset.ext ?? ''
                        }))
                };
            }
            return data;
        }
    });
    React__namespace.useEffect(()=>{
        if (data) {
            notifyStatus(formatMessage({
                id: 'list.asset.at.finished',
                defaultMessage: 'The assets have finished loading.'
            }));
        }
    }, [
        data,
        formatMessage,
        notifyStatus
    ]);
    React__namespace.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error'
                })
            });
        }
    }, [
        error,
        formatMessage,
        toggleNotification
    ]);
    return {
        data,
        error,
        isLoading
    };
};

exports.useAssets = useAssets;
//# sourceMappingURL=useAssets.js.map
