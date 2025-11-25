'use strict';

var designSystem = require('@strapi/design-system');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactQuery = require('react-query');
var Notifications = require('../../../features/Notifications.js');

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

var qs__namespace = /*#__PURE__*/_interopNamespaceDefault(qs);

const MARKETPLACE_API_URL = 'https://market-api.strapi.io';
function useMarketplaceData({ npmPackageType, debouncedSearch, query, tabQuery, strapiVersion }) {
    const { notifyStatus } = designSystem.useNotifyAT();
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = Notifications.useNotification();
    const marketplaceTitle = formatMessage({
        id: 'global.marketplace',
        defaultMessage: 'Marketplace'
    });
    const notifyMarketplaceLoad = ()=>{
        notifyStatus(formatMessage({
            id: 'app.utils.notify.data-loaded',
            defaultMessage: 'The {target} has loaded'
        }, {
            target: marketplaceTitle
        }));
    };
    const paginationParams = {
        page: query?.page || 1,
        pageSize: query?.pageSize || 24
    };
    const pluginParams = {
        ...tabQuery.plugin,
        pagination: paginationParams,
        search: debouncedSearch,
        version: strapiVersion
    };
    const { data: pluginsResponse, status: pluginsStatus } = reactQuery.useQuery([
        'marketplace',
        'plugins',
        pluginParams
    ], async ()=>{
        try {
            const queryString = qs__namespace.stringify(pluginParams);
            const res = await fetch(`${MARKETPLACE_API_URL}/plugins?${queryString}`);
            if (!res.ok) {
                throw new Error('Failed to fetch marketplace plugins.');
            }
            const data = await res.json();
            return data;
        } catch (error) {
        // silence
        }
        return null;
    }, {
        onSuccess () {
            notifyMarketplaceLoad();
        },
        onError () {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occured'
                })
            });
        }
    });
    const providerParams = {
        ...tabQuery.provider,
        pagination: paginationParams,
        search: debouncedSearch,
        version: strapiVersion
    };
    const { data: providersResponse, status: providersStatus } = reactQuery.useQuery([
        'marketplace',
        'providers',
        providerParams
    ], async ()=>{
        const queryString = qs__namespace.stringify(providerParams);
        const res = await fetch(`${MARKETPLACE_API_URL}/providers?${queryString}`);
        if (!res.ok) {
            throw new Error('Failed to fetch marketplace providers.');
        }
        const data = await res.json();
        return data;
    }, {
        onSuccess () {
            notifyMarketplaceLoad();
        },
        onError () {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occured'
                })
            });
        }
    });
    const npmPackageTypeResponse = npmPackageType === 'plugin' ? pluginsResponse : providersResponse;
    const possibleCollections = npmPackageTypeResponse?.meta.collections ?? {};
    const possibleCategories = pluginsResponse?.meta.categories ?? {};
    const { pagination } = npmPackageTypeResponse?.meta ?? {};
    return {
        pluginsResponse,
        providersResponse,
        pluginsStatus,
        providersStatus,
        possibleCollections,
        possibleCategories,
        pagination
    };
}

exports.useMarketplaceData = useMarketplaceData;
//# sourceMappingURL=useMarketplaceData.js.map
