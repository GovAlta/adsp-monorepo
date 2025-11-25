'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var getTrad = require('../../../utils/getTrad.js');
var EditAssetContent = require('../../EditAssetDialog/EditAssetContent.js');
var CarouselAsset = require('./CarouselAsset.js');
var CarouselAssetActions = require('./CarouselAssetActions.js');
var EmptyStateAsset = require('./EmptyStateAsset.js');

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

const CarouselAssets = /*#__PURE__*/ React__namespace.forwardRef(({ assets, disabled = false, error, hint, label, labelAction, onAddAsset, onDeleteAsset, onDeleteAssetFromMediaLibrary, onDropAsset, onEditAsset, onNext, onPrevious, required = false, selectedAssetIndex, trackedLocation }, forwardedRef)=>{
    const { formatMessage } = reactIntl.useIntl();
    const [isEditingAsset, setIsEditingAsset] = React__namespace.useState(false);
    const currentAsset = assets[selectedAssetIndex];
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.CarouselInput, {
                ref: forwardedRef,
                label: label,
                labelAction: labelAction,
                secondaryLabel: currentAsset?.name,
                selectedSlide: selectedAssetIndex,
                previousLabel: formatMessage({
                    id: getTrad.getTrad('mediaLibraryInput.actions.previousSlide'),
                    defaultMessage: 'Previous slide'
                }),
                nextLabel: formatMessage({
                    id: getTrad.getTrad('mediaLibraryInput.actions.nextSlide'),
                    defaultMessage: 'Next slide'
                }),
                onNext: onNext,
                onPrevious: onPrevious,
                hint: hint,
                error: error,
                required: required,
                actions: currentAsset ? /*#__PURE__*/ jsxRuntime.jsx(CarouselAssetActions.CarouselAssetActions, {
                    asset: currentAsset,
                    onDeleteAsset: disabled ? undefined : onDeleteAsset,
                    onAddAsset: disabled ? undefined : onAddAsset,
                    onEditAsset: onEditAsset ? ()=>setIsEditingAsset(true) : undefined
                }) : undefined,
                children: assets.length === 0 ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.CarouselSlide, {
                    label: formatMessage({
                        id: getTrad.getTrad('mediaLibraryInput.slideCount'),
                        defaultMessage: '{n} of {m} slides'
                    }, {
                        n: 1,
                        m: 1
                    }),
                    children: /*#__PURE__*/ jsxRuntime.jsx(EmptyStateAsset.EmptyStateAsset, {
                        disabled: disabled,
                        onClick: onAddAsset,
                        onDropAsset: onDropAsset
                    })
                }) : assets.map((asset, index)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.CarouselSlide, {
                        label: formatMessage({
                            id: getTrad.getTrad('mediaLibraryInput.slideCount'),
                            defaultMessage: '{n} of {m} slides'
                        }, {
                            n: index + 1,
                            m: assets.length
                        }),
                        children: /*#__PURE__*/ jsxRuntime.jsx(CarouselAsset.CarouselAsset, {
                            asset: asset
                        })
                    }, asset.id))
            }),
            /*#__PURE__*/ jsxRuntime.jsx(EditAssetContent.EditAssetDialog, {
                open: isEditingAsset,
                onClose: (editedAsset)=>{
                    setIsEditingAsset(false);
                    // The asset has been deleted
                    if (editedAsset === null) {
                        onDeleteAssetFromMediaLibrary();
                    }
                    if (editedAsset && typeof editedAsset !== 'boolean') {
                        onEditAsset?.(editedAsset);
                    }
                },
                asset: currentAsset,
                canUpdate: true,
                canCopyLink: true,
                canDownload: true,
                trackedLocation: trackedLocation
            })
        ]
    });
});

exports.CarouselAssets = CarouselAssets;
//# sourceMappingURL=CarouselAssets.js.map
