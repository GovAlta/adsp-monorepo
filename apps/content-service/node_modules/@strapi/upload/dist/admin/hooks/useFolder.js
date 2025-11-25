'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactIntl = require('react-intl');
var reactQuery = require('react-query');
var pluginId = require('../pluginId.js');
require('byte-size');
require('date-fns');
var getTrad = require('../utils/getTrad.js');
require('qs');
require('../constants.js');
require('../utils/urlYupSchema.js');

const useFolder = (id, { enabled = true } = {})=>{
    const { toggleNotification } = strapiAdmin.useNotification();
    const { get } = strapiAdmin.useFetchClient();
    const { formatMessage } = reactIntl.useIntl();
    const { data, error, isLoading } = reactQuery.useQuery([
        pluginId.pluginId,
        'folder',
        id
    ], async ()=>{
        const { data: { data } } = await get(`/upload/folders/${id}`, {
            params: {
                populate: {
                    parent: {
                        populate: {
                            parent: '*'
                        }
                    }
                }
            }
        });
        return data;
    }, {
        retry: false,
        enabled,
        staleTime: 0,
        cacheTime: 0,
        onError () {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: getTrad.getTrad('notification.warning.404'),
                    defaultMessage: 'Not found'
                })
            });
        }
    });
    return {
        data,
        error,
        isLoading
    };
};

exports.useFolder = useFolder;
//# sourceMappingURL=useFolder.js.map
