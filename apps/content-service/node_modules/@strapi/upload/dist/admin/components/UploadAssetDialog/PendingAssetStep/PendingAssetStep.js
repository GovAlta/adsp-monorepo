'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
require('byte-size');
require('date-fns');
var getTrad = require('../../../utils/getTrad.js');
require('qs');
require('../../../constants.js');
require('../../../utils/urlYupSchema.js');
var AssetCard = require('../../AssetCard/AssetCard.js');
var UploadingAssetCard = require('../../AssetCard/UploadingAssetCard.js');

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

const Status = {
    Idle: 'IDLE',
    Uploading: 'UPLOADING',
    Intermediate: 'INTERMEDIATE'
};
const PendingAssetStep = ({ addUploadedFiles, folderId, onClose, onEditAsset, onRemoveAsset, assets, onClickAddAsset, onCancelUpload, onUploadSucceed, trackedLocation })=>{
    const assetCountRef = React__namespace.useRef(0);
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = strapiAdmin.useTracking();
    const [uploadStatus, setUploadStatus] = React__namespace.useState(Status.Idle);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        e.stopPropagation();
        const assetsCountByType = assets.reduce((acc, asset)=>{
            const { type } = asset;
            if (type !== undefined && !acc[type]) {
                acc[type] = 0;
            }
            if (type !== undefined) {
                const accType = acc[type];
                const currentCount = typeof accType === 'string' ? accType : accType.toString();
                acc[type] = `${parseInt(currentCount, 10) + 1}`;
            }
            return acc;
        }, {});
        trackUsage('willAddMediaLibraryAssets', {
            location: trackedLocation,
            ...assetsCountByType
        });
        setUploadStatus(Status.Uploading);
    };
    const handleStatusChange = (status, file)=>{
        if (status === 'success' || status === 'error') {
            assetCountRef.current++;
            // There's no "terminated" status. When all the files have called their
            // onUploadSucceed callback, the parent component filters the asset list
            // and closes the modal when the asset list is empty
            if (assetCountRef.current === assets.length) {
                assetCountRef.current = 0;
                setUploadStatus(Status.Intermediate);
            }
        }
        if (status === 'success') {
            onUploadSucceed(file);
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Title, {
                    children: formatMessage({
                        id: getTrad.getTrad('header.actions.add-assets'),
                        defaultMessage: 'Add new assets'
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    direction: "column",
                    alignItems: "stretch",
                    gap: 7,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            justifyContent: "space-between",
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                    direction: "column",
                                    alignItems: "stretch",
                                    gap: 0,
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            variant: "pi",
                                            fontWeight: "bold",
                                            textColor: "neutral800",
                                            children: formatMessage({
                                                id: getTrad.getTrad('list.assets.to-upload'),
                                                defaultMessage: '{number, plural, =0 {No asset} one {1 asset} other {# assets}} ready to upload'
                                            }, {
                                                number: assets.length
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            variant: "pi",
                                            textColor: "neutral600",
                                            children: formatMessage({
                                                id: getTrad.getTrad('modal.upload-list.sub-header-subtitle'),
                                                defaultMessage: 'Manage the assets before adding them to the Media Library'
                                            })
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    size: "S",
                                    onClick: onClickAddAsset,
                                    children: formatMessage({
                                        id: getTrad.getTrad('header.actions.add-assets'),
                                        defaultMessage: 'Add new assets'
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.KeyboardNavigable, {
                            tagName: "article",
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                                gap: 4,
                                children: assets.map((asset)=>{
                                    const assetKey = asset.url;
                                    if (uploadStatus === Status.Uploading || uploadStatus === Status.Intermediate) {
                                        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                            col: 4,
                                            direction: "column",
                                            alignItems: "stretch",
                                            children: /*#__PURE__*/ jsxRuntime.jsx(UploadingAssetCard.UploadingAssetCard, {
                                                // Props used to store the newly uploaded files
                                                addUploadedFiles: addUploadedFiles,
                                                asset: asset,
                                                id: assetKey,
                                                onCancel: onCancelUpload,
                                                onStatusChange: (status)=>handleStatusChange(status, asset.rawFile),
                                                size: "S",
                                                folderId: folderId
                                            })
                                        }, assetKey);
                                    }
                                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                        col: 4,
                                        direction: "column",
                                        alignItems: "stretch",
                                        children: /*#__PURE__*/ jsxRuntime.jsx(AssetCard.AssetCard, {
                                            asset: asset,
                                            size: "S",
                                            local: true,
                                            alt: asset.name,
                                            onEdit: onEditAsset,
                                            onRemove: onRemoveAsset
                                        }, assetKey)
                                    }, assetKey);
                                })
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        onClick: onClose,
                        variant: "tertiary",
                        children: formatMessage({
                            id: 'app.components.Button.cancel',
                            defaultMessage: 'cancel'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        onClick: handleSubmit,
                        loading: uploadStatus === Status.Uploading,
                        children: formatMessage({
                            id: getTrad.getTrad('modal.upload-list.footer.button'),
                            defaultMessage: 'Upload {number, plural, one {# asset} other {# assets}} to the library'
                        }, {
                            number: assets.length
                        })
                    })
                ]
            })
        ]
    });
};

exports.PendingAssetStep = PendingAssetStep;
//# sourceMappingURL=PendingAssetStep.js.map
