import { useNotifyAT } from '@strapi/design-system';
import * as qs from 'qs';
import { useIntl } from 'react-intl';
import { useQuery } from 'react-query';
import { useNotification } from '../../../features/Notifications.mjs';

const MARKETPLACE_API_URL = 'https://market-api.strapi.io';
function useMarketplaceData({ npmPackageType, debouncedSearch, query, tabQuery, strapiVersion }) {
    const { notifyStatus } = useNotifyAT();
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
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
    const { data: pluginsResponse, status: pluginsStatus } = useQuery([
        'marketplace',
        'plugins',
        pluginParams
    ], async ()=>{
        try {
            const queryString = qs.stringify(pluginParams);
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
    const { data: providersResponse, status: providersStatus } = useQuery([
        'marketplace',
        'providers',
        providerParams
    ], async ()=>{
        const queryString = qs.stringify(providerParams);
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

export { useMarketplaceData };
//# sourceMappingURL=useMarketplaceData.mjs.map
