'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactQuery = require('react-query');

function useSettings(isEnabled = true) {
    const { get } = strapiAdmin.useFetchClient();
    return reactQuery.useQuery({
        queryKey: [
            'upload',
            'settings'
        ],
        enabled: isEnabled,
        async queryFn () {
            const { data: { data } } = await get('/upload/settings');
            return data;
        }
    });
}

exports.useSettings = useSettings;
//# sourceMappingURL=useSettings.js.map
