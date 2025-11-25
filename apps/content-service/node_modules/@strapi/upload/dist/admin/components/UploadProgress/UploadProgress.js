'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');

// TODO: find a better naming convention for the file that was an index file before
const BoxWrapper = styledComponents.styled(designSystem.Flex)`
  border-radius: ${({ theme })=>`${theme.borderRadius} ${theme.borderRadius} 0 0`};
  width: 100%;
  height: 100%;

  svg {
    path {
      fill: ${({ theme, error })=>error ? theme.colors.danger600 : undefined};
    }
  }
`;
const CancelButton = styledComponents.styled.button`
  border: none;
  background: none;
  width: min-content;
  color: ${({ theme })=>theme.colors.neutral600};

  &:hover,
  &:focus {
    color: ${({ theme })=>theme.colors.neutral700};
  }

  svg {
    height: 10px;
    width: 10px;

    path {
      fill: currentColor;
    }
  }
`;
const UploadProgress = ({ onCancel, progress = 0, error })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(BoxWrapper, {
        alignItems: "center",
        background: error ? 'danger100' : 'neutral150',
        error: error,
        children: error ? /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {
            "aria-label": error?.message
        }) : /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            direction: "column",
            alignItems: "center",
            gap: 2,
            width: "100%",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.ProgressBar, {
                    value: progress
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    children: `${progress}/100%`
                }),
                /*#__PURE__*/ jsxRuntime.jsx(CancelButton, {
                    type: "button",
                    onClick: onCancel,
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        gap: 2,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "pi",
                                tag: "span",
                                textColor: "inherit",
                                children: formatMessage({
                                    id: 'app.components.Button.cancel',
                                    defaultMessage: 'Cancel'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {
                                "aria-hidden": true
                            })
                        ]
                    })
                })
            ]
        })
    });
};

exports.UploadProgress = UploadProgress;
//# sourceMappingURL=UploadProgress.js.map
