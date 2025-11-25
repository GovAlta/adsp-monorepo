import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { Flex, Box, Typography } from '@strapi/design-system';
import { FilePdf, File } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled, useTheme } from 'styled-components';
import { AssetType } from '../../../constants.mjs';

const CardAsset = styled(Flex)`
  min-height: 26.4rem;
  border-radius: ${({ theme })=>theme.borderRadius} ${({ theme })=>theme.borderRadius} 0 0;
  background: linear-gradient(
    180deg,
    ${({ theme })=>theme.colors.neutral0} 0%,
    ${({ theme })=>theme.colors.neutral100} 121.48%
  );
`;
const AssetPreview = /*#__PURE__*/ React.forwardRef(({ mime, url, name, ...props }, ref)=>{
    const theme = useTheme();
    const { formatMessage } = useIntl();
    if (mime.includes(AssetType.Image)) {
        return /*#__PURE__*/ jsx("img", {
            ref: ref,
            src: url,
            alt: name,
            ...props
        });
    }
    if (mime.includes(AssetType.Video)) {
        return /*#__PURE__*/ jsx(MuxPlayer, {
            src: url,
            accentColor: theme.colors.primary500
        });
    }
    if (mime.includes(AssetType.Audio)) {
        return /*#__PURE__*/ jsx(Box, {
            margin: "5",
            children: /*#__PURE__*/ jsx("audio", {
                controls: true,
                src: url,
                ref: ref,
                ...props,
                children: name
            })
        });
    }
    if (mime.includes('pdf')) {
        return /*#__PURE__*/ jsx(CardAsset, {
            width: "100%",
            justifyContent: "center",
            ...props,
            children: /*#__PURE__*/ jsxs(Flex, {
                gap: 2,
                direction: "column",
                alignItems: "center",
                children: [
                    /*#__PURE__*/ jsx(FilePdf, {
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
        });
    }
    return /*#__PURE__*/ jsx(CardAsset, {
        width: "100%",
        justifyContent: "center",
        ...props,
        children: /*#__PURE__*/ jsxs(Flex, {
            gap: 2,
            direction: "column",
            alignItems: "center",
            children: [
                /*#__PURE__*/ jsx(File, {
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
    });
});
AssetPreview.displayName = 'AssetPreview';

export { AssetPreview };
//# sourceMappingURL=AssetPreview.mjs.map
