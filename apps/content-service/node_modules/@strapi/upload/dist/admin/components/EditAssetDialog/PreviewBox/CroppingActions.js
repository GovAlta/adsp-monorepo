'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
require('byte-size');
require('date-fns');
var getTrad = require('../../../utils/getTrad.js');
require('qs');
require('../../../constants.js');
require('../../../utils/urlYupSchema.js');
var PreviewComponents = require('./PreviewComponents.js');

const CroppingActions = ({ onCancel, onValidate, onDuplicate })=>{
    const { formatMessage } = reactIntl.useIntl();
    const theme = styledComponents.useTheme();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.FocusTrap, {
        onEscape: onCancel,
        children: /*#__PURE__*/ jsxRuntime.jsx(PreviewComponents.CroppingActionRow, {
            justifyContent: "flex-end",
            paddingLeft: 3,
            paddingRight: 3,
            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                gap: 1,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                        label: formatMessage({
                            id: getTrad.getTrad('control-card.stop-crop'),
                            defaultMessage: 'Stop cropping'
                        }),
                        onClick: onCancel,
                        children: /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {})
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Root, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(Trigger, {
                                "aria-label": formatMessage({
                                    id: getTrad.getTrad('control-card.crop'),
                                    defaultMessage: 'Crop'
                                }),
                                variant: "tertiary",
                                paddingLeft: 2,
                                paddingRight: 2,
                                endIcon: null,
                                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {
                                    "aria-hidden": true,
                                    focusable: false,
                                    style: {
                                        position: 'relative',
                                        top: 2
                                    },
                                    fill: "#C0C0D0"
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Content, {
                                zIndex: theme.zIndices.dialog,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                                        onSelect: onValidate,
                                        children: formatMessage({
                                            id: getTrad.getTrad('checkControl.crop-original'),
                                            defaultMessage: 'Crop the original asset'
                                        })
                                    }),
                                    onDuplicate && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                                        onSelect: onDuplicate,
                                        children: formatMessage({
                                            id: getTrad.getTrad('checkControl.crop-duplicate'),
                                            defaultMessage: 'Duplicate & crop the asset'
                                        })
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        })
    });
};
const Trigger = styledComponents.styled(designSystem.Menu.Trigger)`
  svg {
    > g,
    path {
      fill: ${({ theme })=>theme.colors.neutral500};
    }
  }

  &:hover {
    svg {
      > g,
      path {
        fill: ${({ theme })=>theme.colors.neutral600};
      }
    }
  }

  &:active {
    svg {
      > g,
      path {
        fill: ${({ theme })=>theme.colors.neutral400};
      }
    }
  }
`;

exports.CroppingActions = CroppingActions;
//# sourceMappingURL=CroppingActions.js.map
