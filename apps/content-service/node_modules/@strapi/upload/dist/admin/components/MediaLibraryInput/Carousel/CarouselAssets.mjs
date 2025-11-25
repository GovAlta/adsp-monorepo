import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { CarouselInput, CarouselSlide } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTrad } from '../../../utils/getTrad.mjs';
import { EditAssetDialog } from '../../EditAssetDialog/EditAssetContent.mjs';
import { CarouselAsset } from './CarouselAsset.mjs';
import { CarouselAssetActions } from './CarouselAssetActions.mjs';
import { EmptyStateAsset } from './EmptyStateAsset.mjs';

const CarouselAssets = /*#__PURE__*/ React.forwardRef(({ assets, disabled = false, error, hint, label, labelAction, onAddAsset, onDeleteAsset, onDeleteAssetFromMediaLibrary, onDropAsset, onEditAsset, onNext, onPrevious, required = false, selectedAssetIndex, trackedLocation }, forwardedRef)=>{
    const { formatMessage } = useIntl();
    const [isEditingAsset, setIsEditingAsset] = React.useState(false);
    const currentAsset = assets[selectedAssetIndex];
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(CarouselInput, {
                ref: forwardedRef,
                label: label,
                labelAction: labelAction,
                secondaryLabel: currentAsset?.name,
                selectedSlide: selectedAssetIndex,
                previousLabel: formatMessage({
                    id: getTrad('mediaLibraryInput.actions.previousSlide'),
                    defaultMessage: 'Previous slide'
                }),
                nextLabel: formatMessage({
                    id: getTrad('mediaLibraryInput.actions.nextSlide'),
                    defaultMessage: 'Next slide'
                }),
                onNext: onNext,
                onPrevious: onPrevious,
                hint: hint,
                error: error,
                required: required,
                actions: currentAsset ? /*#__PURE__*/ jsx(CarouselAssetActions, {
                    asset: currentAsset,
                    onDeleteAsset: disabled ? undefined : onDeleteAsset,
                    onAddAsset: disabled ? undefined : onAddAsset,
                    onEditAsset: onEditAsset ? ()=>setIsEditingAsset(true) : undefined
                }) : undefined,
                children: assets.length === 0 ? /*#__PURE__*/ jsx(CarouselSlide, {
                    label: formatMessage({
                        id: getTrad('mediaLibraryInput.slideCount'),
                        defaultMessage: '{n} of {m} slides'
                    }, {
                        n: 1,
                        m: 1
                    }),
                    children: /*#__PURE__*/ jsx(EmptyStateAsset, {
                        disabled: disabled,
                        onClick: onAddAsset,
                        onDropAsset: onDropAsset
                    })
                }) : assets.map((asset, index)=>/*#__PURE__*/ jsx(CarouselSlide, {
                        label: formatMessage({
                            id: getTrad('mediaLibraryInput.slideCount'),
                            defaultMessage: '{n} of {m} slides'
                        }, {
                            n: index + 1,
                            m: assets.length
                        }),
                        children: /*#__PURE__*/ jsx(CarouselAsset, {
                            asset: asset
                        })
                    }, asset.id))
            }),
            /*#__PURE__*/ jsx(EditAssetDialog, {
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

export { CarouselAssets };
//# sourceMappingURL=CarouselAssets.mjs.map
