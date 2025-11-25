'use strict';

var React = require('react');
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

const editAssetRequest = (asset, file, signal, onProgress, post)=>{
    const endpoint = `/${pluginId.pluginId}?id=${asset.id}`;
    const formData = new FormData();
    if (file) {
        formData.append('files', file);
    }
    formData.append('fileInfo', JSON.stringify({
        alternativeText: asset.alternativeText,
        caption: asset.caption,
        folder: asset.folder,
        name: asset.name
    }));
    /**
   * onProgress is not possible using native fetch
   * need to look into an alternative to make it work
   * perhaps using xhr like Axios does
   */ return post(endpoint, formData, {
        signal
    }).then((res)=>res.data);
};
const useEditAsset = ()=>{
    const [progress, setProgress] = React__namespace.useState(0);
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const queryClient = reactQuery.useQueryClient();
    const abortController = new AbortController();
    const signal = abortController.signal;
    const { post } = strapiAdmin.useFetchClient();
    const mutation = reactQuery.useMutation(({ asset, file })=>editAssetRequest(asset, file, signal, setProgress, post), {
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
            queryClient.refetchQueries([
                pluginId.pluginId,
                'folders'
            ], {
                active: true
            });
        },
        onError (reason) {
            if (reason?.response?.status === 403) {
                toggleNotification({
                    type: 'info',
                    message: formatMessage({
                        id: getTrad.getTrad('permissions.not-allowed.update')
                    })
                });
            } else {
                toggleNotification({
                    type: 'danger',
                    message: reason?.message
                });
            }
        }
    });
    const editAsset = (asset, file)=>mutation.mutateAsync({
            asset,
            file
        });
    const cancel = ()=>abortController.abort();
    return {
        ...mutation,
        cancel,
        editAsset,
        progress,
        status: mutation.status
    };
};

exports.useEditAsset = useEditAsset;
//# sourceMappingURL=useEditAsset.js.map
