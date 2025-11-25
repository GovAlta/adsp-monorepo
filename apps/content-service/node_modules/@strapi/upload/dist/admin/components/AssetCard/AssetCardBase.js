'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
require('byte-size');
require('date-fns');
var getTrad = require('../../utils/getTrad.js');
require('qs');
require('../../constants.js');
require('../../utils/urlYupSchema.js');

const Extension = styledComponents.styled.span`
  text-transform: uppercase;
`;
const CardActionsContainer = styledComponents.styled(designSystem.CardAction)`
  opacity: 0;
  z-index: 1;

  &:focus-within {
    opacity: 1;
  }
`;
const CardCheckboxWrapper = styledComponents.styled.div`
  z-index: 1;
`;
const CardContainer = styledComponents.styled(designSystem.Card)`
  cursor: pointer;

  &:hover {
    ${CardActionsContainer} {
      opacity: 1;
    }
  }
`;
const AssetCardBase = ({ children, extension, isSelectable = false, name, onSelect, onRemove, onEdit, selected = false, subtitle = '', variant = 'Image', className })=>{
    const { formatMessage } = reactIntl.useIntl();
    const handleClick = (e)=>{
        if (onEdit) {
            onEdit(e);
        }
    };
    /**
   * This is required because we need to stop the propagation of the event
   * bubbling to the `CardContainer`, however the `CardCheckbox` only returns
   * the `boolean` value as opposed to the event itself.
   */ const handlePropagationClick = (e)=>{
        e.stopPropagation();
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(CardContainer, {
        className: className,
        role: "button",
        height: "100%",
        tabIndex: -1,
        onClick: handleClick,
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.CardHeader, {
                children: [
                    isSelectable && /*#__PURE__*/ jsxRuntime.jsx(CardCheckboxWrapper, {
                        onClick: handlePropagationClick,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardCheckbox, {
                            checked: selected,
                            onCheckedChange: onSelect
                        })
                    }),
                    (onRemove || onEdit) && /*#__PURE__*/ jsxRuntime.jsxs(CardActionsContainer, {
                        onClick: handlePropagationClick,
                        position: "end",
                        children: [
                            onRemove && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                label: formatMessage({
                                    id: getTrad.getTrad('control-card.remove-selection'),
                                    defaultMessage: 'Remove from selection'
                                }),
                                onClick: onRemove,
                                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Trash, {})
                            }),
                            onEdit && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                label: formatMessage({
                                    id: getTrad.getTrad('control-card.edit'),
                                    defaultMessage: 'Edit'
                                }),
                                onClick: onEdit,
                                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
                            })
                        ]
                    }),
                    children
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.CardBody, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.CardContent, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                paddingTop: 1,
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    tag: "h2",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardTitle, {
                                        tag: "span",
                                        children: name
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.CardSubtitle, {
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(Extension, {
                                        children: extension
                                    }),
                                    subtitle
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        paddingTop: 1,
                        grow: 1,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardBadge, {
                            children: formatMessage({
                                id: getTrad.getTrad(`settings.section.${variant.toLowerCase()}.label`),
                                defaultMessage: variant
                            })
                        })
                    })
                ]
            })
        ]
    });
};

exports.AssetCardBase = AssetCardBase;
//# sourceMappingURL=AssetCardBase.js.map
