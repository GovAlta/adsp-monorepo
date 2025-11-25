import { jsx } from 'react/jsx-runtime';
import { CardAsset } from '@strapi/design-system';
import { appendSearchParamsToUrl } from '../../utils/appendSearchParamsToUrl.mjs';
import 'byte-size';
import 'date-fns';
import 'qs';
import '../../constants.mjs';
import '../../utils/urlYupSchema.mjs';
import { AssetCardBase } from './AssetCardBase.mjs';

const ImageAssetCard = ({ height, width, thumbnail, size = 'M', alt, isUrlSigned, selected = false, ...props })=>{
    // appending the updatedAt param to the thumbnail URL prevents it from being cached by the browser (cache busting)
    // applied only if the url is not signed to prevent the signature from being invalidated
    const thumbnailUrl = isUrlSigned ? thumbnail : appendSearchParamsToUrl({
        url: thumbnail,
        params: {
            updatedAt: props.updatedAt
        }
    });
    const subtitle = height && width ? ` - ${width}✕${height}` : undefined;
    return /*#__PURE__*/ jsx(AssetCardBase, {
        ...props,
        selected: selected,
        subtitle: subtitle,
        variant: "Image",
        children: /*#__PURE__*/ jsx(CardAsset, {
            src: thumbnailUrl,
            size: size,
            alt: alt
        })
    });
};

export { ImageAssetCard };
//# sourceMappingURL=ImageAssetCard.mjs.map
