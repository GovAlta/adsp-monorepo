import { jsx, jsxs } from 'react/jsx-runtime';
import { Flex, Typography } from '@strapi/design-system';
import { FilePdf, File } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { AssetCardBase } from './AssetCardBase.mjs';

const CardAsset = styled(Flex)`
  border-radius: ${({ theme })=>theme.borderRadius} ${({ theme })=>theme.borderRadius} 0 0;
  background: linear-gradient(
    180deg,
    ${({ theme })=>theme.colors.neutral0} 0%,
    ${({ theme })=>theme.colors.neutral100} 121.48%
  );
`;
const DocAssetCard = ({ name, extension, size = 'M', selected = false, ...restProps })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(AssetCardBase, {
        name: name,
        extension: extension,
        selected: selected,
        ...restProps,
        variant: "Doc",
        children: /*#__PURE__*/ jsx(CardAsset, {
            width: "100%",
            height: size === 'S' ? `8.8rem` : `16.4rem`,
            justifyContent: "center",
            children: /*#__PURE__*/ jsxs(Flex, {
                gap: 2,
                direction: "column",
                alignItems: "center",
                children: [
                    extension === 'pdf' ? /*#__PURE__*/ jsx(FilePdf, {
                        "aria-label": name,
                        fill: "neutral500",
                        width: 24,
                        height: 24
                    }) : /*#__PURE__*/ jsx(File, {
                        "aria-label": name,
                        fill: "neutral500",
                        width: 24,
                        height: 24
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        textColor: "neutral500",
                        variant: "pi",
                        children: formatMessage({
                            id: 'noPreview',
                            defaultMessage: 'No preview available'
                        })
                    })
                ]
            })
        })
    });
};

export { DocAssetCard };
//# sourceMappingURL=DocAssetCard.mjs.map
