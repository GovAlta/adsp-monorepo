import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { CardAction, Card, CardHeader, CardCheckbox, IconButton, CardBody, CardContent, Box, Typography, CardTitle, CardSubtitle, Flex, CardBadge } from '@strapi/design-system';
import { Trash, Pencil } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../utils/getTrad.mjs';
import 'qs';
import '../../constants.mjs';
import '../../utils/urlYupSchema.mjs';

const Extension = styled.span`
  text-transform: uppercase;
`;
const CardActionsContainer = styled(CardAction)`
  opacity: 0;
  z-index: 1;

  &:focus-within {
    opacity: 1;
  }
`;
const CardCheckboxWrapper = styled.div`
  z-index: 1;
`;
const CardContainer = styled(Card)`
  cursor: pointer;

  &:hover {
    ${CardActionsContainer} {
      opacity: 1;
    }
  }
`;
const AssetCardBase = ({ children, extension, isSelectable = false, name, onSelect, onRemove, onEdit, selected = false, subtitle = '', variant = 'Image', className })=>{
    const { formatMessage } = useIntl();
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
    return /*#__PURE__*/ jsxs(CardContainer, {
        className: className,
        role: "button",
        height: "100%",
        tabIndex: -1,
        onClick: handleClick,
        children: [
            /*#__PURE__*/ jsxs(CardHeader, {
                children: [
                    isSelectable && /*#__PURE__*/ jsx(CardCheckboxWrapper, {
                        onClick: handlePropagationClick,
                        children: /*#__PURE__*/ jsx(CardCheckbox, {
                            checked: selected,
                            onCheckedChange: onSelect
                        })
                    }),
                    (onRemove || onEdit) && /*#__PURE__*/ jsxs(CardActionsContainer, {
                        onClick: handlePropagationClick,
                        position: "end",
                        children: [
                            onRemove && /*#__PURE__*/ jsx(IconButton, {
                                label: formatMessage({
                                    id: getTrad('control-card.remove-selection'),
                                    defaultMessage: 'Remove from selection'
                                }),
                                onClick: onRemove,
                                children: /*#__PURE__*/ jsx(Trash, {})
                            }),
                            onEdit && /*#__PURE__*/ jsx(IconButton, {
                                label: formatMessage({
                                    id: getTrad('control-card.edit'),
                                    defaultMessage: 'Edit'
                                }),
                                onClick: onEdit,
                                children: /*#__PURE__*/ jsx(Pencil, {})
                            })
                        ]
                    }),
                    children
                ]
            }),
            /*#__PURE__*/ jsxs(CardBody, {
                children: [
                    /*#__PURE__*/ jsxs(CardContent, {
                        children: [
                            /*#__PURE__*/ jsx(Box, {
                                paddingTop: 1,
                                children: /*#__PURE__*/ jsx(Typography, {
                                    tag: "h2",
                                    children: /*#__PURE__*/ jsx(CardTitle, {
                                        tag: "span",
                                        children: name
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxs(CardSubtitle, {
                                children: [
                                    /*#__PURE__*/ jsx(Extension, {
                                        children: extension
                                    }),
                                    subtitle
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(Flex, {
                        paddingTop: 1,
                        grow: 1,
                        children: /*#__PURE__*/ jsx(CardBadge, {
                            children: formatMessage({
                                id: getTrad(`settings.section.${variant.toLowerCase()}.label`),
                                defaultMessage: variant
                            })
                        })
                    })
                ]
            })
        ]
    });
};

export { AssetCardBase };
//# sourceMappingURL=AssetCardBase.mjs.map
