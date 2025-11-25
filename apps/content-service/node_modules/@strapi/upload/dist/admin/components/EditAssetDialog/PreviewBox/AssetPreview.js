'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var MuxPlayer = require('@mux/mux-player-react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var constants = require('../../../constants.js');

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

const CardAsset = styledComponents.styled(designSystem.Flex)`
  min-height: 26.4rem;
  border-radius: ${({ theme })=>theme.borderRadius} ${({ theme })=>theme.borderRadius} 0 0;
  background: linear-gradient(
    180deg,
    ${({ theme })=>theme.colors.neutral0} 0%,
    ${({ theme })=>theme.colors.neutral100} 121.48%
  );
`;
const AssetPreview = /*#__PURE__*/ React__namespace.forwardRef(({ mime, url, name, ...props }, ref)=>{
    const theme = styledComponents.useTheme();
    const { formatMessage } = reactIntl.useIntl();
    if (mime.includes(constants.AssetType.Image)) {
        return /*#__PURE__*/ jsxRuntime.jsx("img", {
            ref: ref,
            src: url,
            alt: name,
            ...props
        });
    }
    if (mime.includes(constants.AssetType.Video)) {
        return /*#__PURE__*/ jsxRuntime.jsx(MuxPlayer, {
            src: url,
            accentColor: theme.colors.primary500
        });
    }
    if (mime.includes(constants.AssetType.Audio)) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
            margin: "5",
            children: /*#__PURE__*/ jsxRuntime.jsx("audio", {
                controls: true,
                src: url,
                ref: ref,
                ...props,
                children: name
            })
        });
    }
    if (mime.includes('pdf')) {
        return /*#__PURE__*/ jsxRuntime.jsx(CardAsset, {
            width: "100%",
            justifyContent: "center",
            ...props,
            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                gap: 2,
                direction: "column",
                alignItems: "center",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(icons.FilePdf, {
                        "aria-label": name,
                        fill: "neutral500",
                        width: 24,
                        height: 24
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
    return /*#__PURE__*/ jsxRuntime.jsx(CardAsset, {
        width: "100%",
        justifyContent: "center",
        ...props,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            direction: "column",
            alignItems: "center",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(icons.File, {
                    "aria-label": name,
                    fill: "neutral500",
                    width: 24,
                    height: 24
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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

exports.AssetPreview = AssetPreview;
//# sourceMappingURL=AssetPreview.js.map
