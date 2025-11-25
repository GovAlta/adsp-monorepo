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

const useBulkMove = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const queryClient = reactQuery.useQueryClient();
    const { post } = strapiAdmin.useFetchClient();
    const bulkMoveQuery = ({ destinationFolderId, filesAndFolders })=>{
        const payload = filesAndFolders.reduce((acc, selected)=>{
            const { id, type } = selected;
            const key = type === 'asset' ? 'fileIds' : 'folderIds';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(id);
            return acc;
        }, {});
        return post('/upload/actions/bulk-move', {
            ...payload,
            destinationFolderId
        });
    };
    const mutation = reactQuery.useMutation(bulkMoveQuery, {
        onSuccess (res) {
            const { data: { data } } = res;
            if (data?.files?.length > 0) {
                queryClient.refetchQueries([
                    pluginId.pluginId,
                    'assets'
                ], {
                    active: true
                });
                queryClient.refetchQueries([
                    pluginId.pluginId,
                    'asset-count'
                ], {
                    active: true
                });
            }
            // folders need to be re-fetched in any case, because assets might have been
            // moved into a sub-folder and therefore the count needs to be updated
            queryClient.refetchQueries([
                pluginId.pluginId,
                'folders'
            ], {
                active: true
            });
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: getTrad.getTrad('modal.move.success-label'),
                    defaultMessage: 'Elements have been moved successfully.'
                })
            });
        }
    });
    const move = (destinationFolderId, filesAndFolders)=>mutation.mutateAsync({
            destinationFolderId,
            filesAndFolders
        });
    return {
        ...mutation,
        move
    };
};

exports.useBulkMove = useBulkMove;
//# sourceMappingURL=useBulkMove.js.map
