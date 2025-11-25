import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Typography, Dialog, Field, Checkbox, Flex, Button } from '@strapi/design-system';
import { WarningCircle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { getTranslation } from '../utils/getTranslation.mjs';

const TextAlignTypography = styled(Typography)`
  text-align: center;
`;
const CheckboxConfirmation = ({ description, isCreating = false, intlLabel, name, onChange, value })=>{
    const { formatMessage } = useIntl();
    const [isOpen, setIsOpen] = React.useState(false);
    const handleChange = (value)=>{
        if (isCreating || value) {
            return onChange({
                target: {
                    name,
                    value,
                    type: 'checkbox'
                }
            });
        }
        if (!value) {
            return setIsOpen(true);
        }
        return null;
    };
    const handleConfirm = ()=>{
        onChange({
            target: {
                name,
                value: false,
                type: 'checkbox'
            }
        });
    };
    const label = intlLabel.id ? formatMessage({
        id: intlLabel.id,
        defaultMessage: intlLabel.defaultMessage
    }, {
        ...intlLabel.values
    }) : name;
    const hint = description ? formatMessage({
        id: description.id,
        defaultMessage: description.defaultMessage
    }, {
        ...description.values
    }) : '';
    return /*#__PURE__*/ jsxs(Dialog.Root, {
        open: isOpen,
        onOpenChange: setIsOpen,
        children: [
            /*#__PURE__*/ jsxs(Field.Root, {
                hint: hint,
                name: name,
                children: [
                    /*#__PURE__*/ jsx(Checkbox, {
                        onCheckedChange: handleChange,
                        checked: value,
                        children: label
                    }),
                    /*#__PURE__*/ jsx(Field.Hint, {})
                ]
            }),
            /*#__PURE__*/ jsxs(Dialog.Content, {
                children: [
                    /*#__PURE__*/ jsx(Dialog.Header, {
                        children: formatMessage({
                            id: getTranslation('CheckboxConfirmation.Modal.title'),
                            defaultMessage: 'Disable localization'
                        })
                    }),
                    /*#__PURE__*/ jsx(Dialog.Body, {
                        icon: /*#__PURE__*/ jsx(WarningCircle, {}),
                        children: /*#__PURE__*/ jsxs(Flex, {
                            direction: "column",
                            alignItems: "stretch",
                            gap: 2,
                            children: [
                                /*#__PURE__*/ jsx(Flex, {
                                    justifyContent: "center",
                                    children: /*#__PURE__*/ jsx(TextAlignTypography, {
                                        children: formatMessage({
                                            id: getTranslation('CheckboxConfirmation.Modal.content'),
                                            defaultMessage: 'Disabling localization will engender the deletion of all your content but the one associated to your default locale (if existing).'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx(Flex, {
                                    justifyContent: "center",
                                    children: /*#__PURE__*/ jsx(Typography, {
                                        fontWeight: "semiBold",
                                        children: formatMessage({
                                            id: getTranslation('CheckboxConfirmation.Modal.body'),
                                            defaultMessage: 'Do you want to disable it?'
                                        })
                                    })
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsxs(Dialog.Footer, {
                        children: [
                            /*#__PURE__*/ jsx(Dialog.Cancel, {
                                children: /*#__PURE__*/ jsx(Button, {
                                    variant: "tertiary",
                                    children: formatMessage({
                                        id: 'components.popUpWarning.button.cancel',
                                        defaultMessage: 'No, cancel'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(Dialog.Action, {
                                children: /*#__PURE__*/ jsx(Button, {
                                    variant: "danger-light",
                                    onClick: handleConfirm,
                                    children: formatMessage({
                                        id: getTranslation('CheckboxConfirmation.Modal.button-confirm'),
                                        defaultMessage: 'Yes, disable'
                                    })
                                })
                            })
                        ]
                    })
                ]
            })
        ]
    });
};

export { CheckboxConfirmation };
//# sourceMappingURL=CheckboxConfirmation.mjs.map
