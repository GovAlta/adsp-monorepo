import { jsxs, jsx } from 'react/jsx-runtime';
import { Flex, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../utils/getTrad.mjs';
import 'qs';
import '../../../constants.mjs';
import '../../../utils/urlYupSchema.mjs';
import { AssetGridList } from '../../AssetGridList/AssetGridList.mjs';

// TODO: find a better naming convention for the file that was an index file before
const SelectedStep = ({ selectedAssets, onSelectAsset, onReorderAsset })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 4,
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                gap: 0,
                direction: "column",
                alignItems: "start",
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "pi",
                        fontWeight: "bold",
                        textColor: "neutral800",
                        children: formatMessage({
                            id: getTrad('list.assets.to-upload'),
                            defaultMessage: '{number, plural, =0 {No asset} one {1 asset} other {# assets}} ready to upload'
                        }, {
                            number: selectedAssets.length
                        })
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "pi",
                        textColor: "neutral600",
                        children: formatMessage({
                            id: getTrad('modal.upload-list.sub-header-subtitle'),
                            defaultMessage: 'Manage the assets before adding them to the Media Library'
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsx(AssetGridList, {
                size: "S",
                assets: selectedAssets,
                onSelectAsset: onSelectAsset,
                selectedAssets: selectedAssets,
                onReorderAsset: onReorderAsset
            })
        ]
    });
};

export { SelectedStep };
//# sourceMappingURL=SelectedStep.mjs.map
