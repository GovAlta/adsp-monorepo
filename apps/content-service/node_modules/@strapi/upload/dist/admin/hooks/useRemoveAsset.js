'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactIntl = require('react-intl');
var reactQuery = require('react-query');
var reactRedux = require('react-redux');
var pluginId = require('../pluginId.js');

const useRemoveAsset = (onSuccess)=>{
    const dispatch = reactRedux.useDispatch();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { formatMessage } = reactIntl.useIntl();
    const queryClient = reactQuery.useQueryClient();
    const { del } = strapiAdmin.useFetchClient();
    const mutation = reactQuery.useMutation((assetId)=>del(`/upload/files/${assetId}`), {
        onSuccess () {
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
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'modal.remove.success-label',
                    defaultMessage: 'Elements have been successfully deleted.'
                })
            });
            dispatch(strapiAdmin.adminApi.util.invalidateTags([
                'HomepageKeyStatistics'
            ]));
            onSuccess();
        },
        onError (error) {
            toggleNotification({
                type: 'danger',
                message: error.message
            });
        }
    });
    const removeAsset = async (assetId)=>{
        await mutation.mutateAsync(assetId);
    };
    return {
        ...mutation,
        removeAsset
    };
};

exports.useRemoveAsset = useRemoveAsset;
//# sourceMappingURL=useRemoveAsset.js.map
