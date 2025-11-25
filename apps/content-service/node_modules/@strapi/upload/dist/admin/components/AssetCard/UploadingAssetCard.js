'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var constants = require('../../constants.js');
var useUpload = require('../../hooks/useUpload.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../utils/getTrad.js');
require('qs');
require('../../utils/urlYupSchema.js');
var UploadProgress = require('../UploadProgress/UploadProgress.js');

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

const UploadProgressWrapper = styledComponents.styled.div`
  height: 8.8rem;
  width: 100%;
`;
const Extension = styledComponents.styled.span`
  text-transform: uppercase;
`;
const UploadingAssetCard = ({ asset, onCancel, onStatusChange, addUploadedFiles, folderId = null })=>{
    const { upload, cancel, error, progress, status } = useUpload.useUpload();
    const { formatMessage } = reactIntl.useIntl();
    let badgeContent = formatMessage({
        id: getTrad.getTrad('settings.section.doc.label'),
        defaultMessage: 'Doc'
    });
    if (asset.type === constants.AssetType.Image) {
        badgeContent = formatMessage({
            id: getTrad.getTrad('settings.section.image.label'),
            defaultMessage: 'Image'
        });
    } else if (asset.type === constants.AssetType.Video) {
        badgeContent = formatMessage({
            id: getTrad.getTrad('settings.section.video.label'),
            defaultMessage: 'Video'
        });
    } else if (asset.type === constants.AssetType.Audio) {
        badgeContent = formatMessage({
            id: getTrad.getTrad('settings.section.audio.label'),
            defaultMessage: 'Audio'
        });
    }
    React__namespace.useEffect(()=>{
        const uploadFile = async ()=>{
            const files = await upload(asset, folderId ? Number(folderId) : null);
            if (addUploadedFiles) {
                addUploadedFiles(files);
            }
        };
        uploadFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    React__namespace.useEffect(()=>{
        onStatusChange(status);
    }, [
        status,
        onStatusChange
    ]);
    const handleCancel = ()=>{
        cancel();
        onCancel(asset.rawFile);
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 1,
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Card, {
                borderColor: error ? 'danger600' : 'neutral150',
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardHeader, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(UploadProgressWrapper, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(UploadProgress.UploadProgress, {
                                error: error || undefined,
                                onCancel: handleCancel,
                                progress: progress
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.CardBody, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.CardContent, {
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                        paddingTop: 1,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            tag: "h2",
                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardTitle, {
                                                tag: "span",
                                                children: asset.name
                                            })
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardSubtitle, {
                                        children: /*#__PURE__*/ jsxRuntime.jsx(Extension, {
                                            children: asset.ext
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                paddingTop: 1,
                                grow: 1,
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardBadge, {
                                    children: badgeContent
                                })
                            })
                        ]
                    })
                ]
            }),
            error ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                variant: "pi",
                fontWeight: "bold",
                textColor: "danger600",
                children: formatMessage(error?.message ? {
                    id: getTrad.getTrad(`apiError.${error.message}`),
                    defaultMessage: error.message
                } : {
                    id: getTrad.getTrad('upload.generic-error'),
                    defaultMessage: 'An error occured while uploading the file.'
                })
            }) : undefined
        ]
    });
};

exports.UploadingAssetCard = UploadingAssetCard;
//# sourceMappingURL=UploadingAssetCard.js.map
