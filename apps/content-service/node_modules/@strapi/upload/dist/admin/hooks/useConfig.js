'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactIntl = require('react-intl');
var reactQuery = require('react-query');
var pluginId = require('../pluginId.js');

const endpoint = `/${pluginId.pluginId}/configuration`;
const queryKey = [
    pluginId.pluginId,
    'configuration'
];
const useConfig = ()=>{
    const { trackUsage } = strapiAdmin.useTracking();
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { get, put } = strapiAdmin.useFetchClient();
    const config = reactQuery.useQuery(queryKey, async ()=>{
        const res = await get(endpoint);
        return res.data.data;
    }, {
        onError () {
            return toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error'
                })
            });
        },
        /**
       * We're cementing that we always expect an object to be returned.
       */ select: (data)=>data || {}
    });
    const putMutation = reactQuery.useMutation(async (body)=>{
        await put(endpoint, body);
    }, {
        onSuccess () {
            trackUsage('didEditMediaLibraryConfig');
            config.refetch();
        },
        onError () {
            return toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error'
                })
            });
        }
    });
    return {
        config,
        mutateConfig: putMutation
    };
};

exports.useConfig = useConfig;
//# sourceMappingURL=useConfig.js.map
