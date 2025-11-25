'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactQuery = require('react-query');
var reactRedux = require('react-redux');
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

const endpoint = `/${pluginId.pluginId}`;
const uploadAssets = (assets, folderId, signal, onProgress, post)=>{
    const assetsArray = Array.isArray(assets) ? assets : [
        assets
    ];
    const formData = new FormData();
    // Add all files to the form data
    assetsArray.forEach((asset)=>{
        if (asset.rawFile) {
            formData.append('files', asset.rawFile);
        }
    });
    // Add each fileInfo as a separate stringified field
    assetsArray.forEach((asset)=>{
        formData.append('fileInfo', JSON.stringify({
            name: asset.name,
            caption: asset.caption,
            alternativeText: asset.alternativeText,
            folder: folderId
        }));
    });
    /**
   * onProgress is not possible using native fetch
   * need to look into an alternative to make it work
   * perhaps using xhr like Axios does
   */ return post(endpoint, formData, {
        signal
    }).then((res)=>res.data);
};
const useUpload = ()=>{
    const dispatch = reactRedux.useDispatch();
    const [progress, setProgress] = React__namespace.useState(0);
    const queryClient = reactQuery.useQueryClient();
    const abortController = new AbortController();
    const signal = abortController.signal;
    const { post } = strapiAdmin.useFetchClient();
    const mutation = reactQuery.useMutation(({ assets, folderId })=>{
        return uploadAssets(assets, folderId, signal, setProgress, post);
    }, {
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
            dispatch(strapiAdmin.adminApi.util.invalidateTags([
                'HomepageKeyStatistics',
                'AIUsage'
            ]));
        }
    });
    const upload = (assets, folderId)=>mutation.mutateAsync({
            assets,
            folderId
        });
    const cancel = ()=>abortController.abort();
    return {
        upload,
        isLoading: mutation.isLoading,
        cancel,
        error: mutation.error,
        progress,
        status: mutation.status
    };
};

exports.useUpload = useUpload;
//# sourceMappingURL=useUpload.js.map
