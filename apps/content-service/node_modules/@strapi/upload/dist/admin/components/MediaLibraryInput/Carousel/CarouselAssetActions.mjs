import { jsxs, jsx } from 'react/jsx-runtime';
import { CarouselActions, IconButton } from '@strapi/design-system';
import { Plus, Trash, Pencil } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { prefixFileUrlWithBackendUrl } from '../../../utils/prefixFileUrlWithBackendUrl.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../utils/getTrad.mjs';
import 'qs';
import '../../../constants.mjs';
import '../../../utils/urlYupSchema.mjs';
import { CopyLinkButton } from '../../CopyLinkButton/CopyLinkButton.mjs';

const CarouselAssetActions = ({ asset, onDeleteAsset, onAddAsset, onEditAsset })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(CarouselActions, {
        children: [
            onAddAsset && /*#__PURE__*/ jsx(IconButton, {
                label: formatMessage({
                    id: getTrad('control-card.add'),
                    defaultMessage: 'Add'
                }),
                onClick: ()=>onAddAsset(asset),
                children: /*#__PURE__*/ jsx(Plus, {})
            }),
            /*#__PURE__*/ jsx(CopyLinkButton, {
                url: prefixFileUrlWithBackendUrl(asset.url)
            }),
            onDeleteAsset && /*#__PURE__*/ jsx(IconButton, {
                label: formatMessage({
                    id: 'global.delete',
                    defaultMessage: 'Delete'
                }),
                onClick: ()=>onDeleteAsset(asset),
                children: /*#__PURE__*/ jsx(Trash, {})
            }),
            onEditAsset && /*#__PURE__*/ jsx(IconButton, {
                label: formatMessage({
                    id: getTrad('control-card.edit'),
                    defaultMessage: 'edit'
                }),
                onClick: onEditAsset,
                children: /*#__PURE__*/ jsx(Pencil, {})
            })
        ]
    });
};

export { CarouselAssetActions };
//# sourceMappingURL=CarouselAssetActions.mjs.map
