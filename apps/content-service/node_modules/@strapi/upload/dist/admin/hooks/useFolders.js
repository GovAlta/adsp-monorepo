'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var qs = require('qs');
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

const useFolders = ({ enabled = true, query = {} } = {})=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { notifyStatus } = designSystem.useNotifyAT();
    const { folder, _q, ...paramsExceptFolderAndQ } = query;
    const { get } = strapiAdmin.useFetchClient();
    let params;
    if (_q) {
        params = {
            ...paramsExceptFolderAndQ,
            pagination: {
                pageSize: -1
            },
            _q
        };
    } else {
        params = {
            ...paramsExceptFolderAndQ,
            pagination: {
                pageSize: -1
            },
            filters: {
                $and: [
                    ...paramsExceptFolderAndQ?.filters?.$and ?? [],
                    {
                        parent: {
                            id: folder ?? {
                                $null: true
                            }
                        }
                    }
                ]
            }
        };
    }
    const { data, error, isLoading } = reactQuery.useQuery([
        pluginId.pluginId,
        'folders',
        qs.stringify(params)
    ], async ()=>{
        const { data: { data } } = await get('/upload/folders', {
            params
        });
        return data;
    }, {
        enabled,
        staleTime: 0,
        cacheTime: 0,
        onError () {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error'
                })
            });
        }
    });
    React__namespace.useEffect(()=>{
        if (data) {
            notifyStatus(formatMessage({
                id: 'list.asset.at.finished',
                defaultMessage: 'The folders have finished loading.'
            }));
        }
    }, [
        data,
        formatMessage,
        notifyStatus
    ]);
    return {
        data,
        error,
        isLoading
    };
};

exports.useFolders = useFolders;
//# sourceMappingURL=useFolders.js.map
