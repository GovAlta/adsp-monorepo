import { jsx, jsxs } from 'react/jsx-runtime';
import { Menu, FocusTrap, Flex, IconButton } from '@strapi/design-system';
import { Cross, Check } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled, useTheme } from 'styled-components';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../utils/getTrad.mjs';
import 'qs';
import '../../../constants.mjs';
import '../../../utils/urlYupSchema.mjs';
import { CroppingActionRow } from './PreviewComponents.mjs';

const CroppingActions = ({ onCancel, onValidate, onDuplicate })=>{
    const { formatMessage } = useIntl();
    const theme = useTheme();
    return /*#__PURE__*/ jsx(FocusTrap, {
        onEscape: onCancel,
        children: /*#__PURE__*/ jsx(CroppingActionRow, {
            justifyContent: "flex-end",
            paddingLeft: 3,
            paddingRight: 3,
            children: /*#__PURE__*/ jsxs(Flex, {
                gap: 1,
                children: [
                    /*#__PURE__*/ jsx(IconButton, {
                        label: formatMessage({
                            id: getTrad('control-card.stop-crop'),
                            defaultMessage: 'Stop cropping'
                        }),
                        onClick: onCancel,
                        children: /*#__PURE__*/ jsx(Cross, {})
                    }),
                    /*#__PURE__*/ jsxs(Menu.Root, {
                        children: [
                            /*#__PURE__*/ jsx(Trigger, {
                                "aria-label": formatMessage({
                                    id: getTrad('control-card.crop'),
                                    defaultMessage: 'Crop'
                                }),
                                variant: "tertiary",
                                paddingLeft: 2,
                                paddingRight: 2,
                                endIcon: null,
                                children: /*#__PURE__*/ jsx(Check, {
                                    "aria-hidden": true,
                                    focusable: false,
                                    style: {
                                        position: 'relative',
                                        top: 2
                                    },
                                    fill: "#C0C0D0"
                                })
                            }),
                            /*#__PURE__*/ jsxs(Menu.Content, {
                                zIndex: theme.zIndices.dialog,
                                children: [
                                    /*#__PURE__*/ jsx(Menu.Item, {
                                        onSelect: onValidate,
                                        children: formatMessage({
                                            id: getTrad('checkControl.crop-original'),
                                            defaultMessage: 'Crop the original asset'
                                        })
                                    }),
                                    onDuplicate && /*#__PURE__*/ jsx(Menu.Item, {
                                        onSelect: onDuplicate,
                                        children: formatMessage({
                                            id: getTrad('checkControl.crop-duplicate'),
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
const Trigger = styled(Menu.Trigger)`
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

export { CroppingActions };
//# sourceMappingURL=CroppingActions.mjs.map
