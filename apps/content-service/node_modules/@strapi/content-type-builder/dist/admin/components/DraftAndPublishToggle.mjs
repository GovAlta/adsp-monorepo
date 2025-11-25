import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { ConfirmDialog } from '@strapi/admin/strapi-admin';
import { Field, Checkbox, Dialog, Button } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTrad } from '../utils/getTrad.mjs';

const DraftAndPublishToggle = ({ description, disabled = false, intlLabel, isCreating, name, onChange, value = false })=>{
    const { formatMessage } = useIntl();
    const [showWarning, setShowWarning] = useState(false);
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
    const handleConfirm = ()=>{
        onChange({
            target: {
                name,
                value: false
            }
        });
        setShowWarning(false);
    };
    const handleChange = (checked)=>{
        if (!checked && !isCreating) {
            setShowWarning(true);
            return;
        }
        onChange({
            target: {
                name,
                value: !!checked
            }
        });
    };
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsxs(Field.Root, {
                hint: hint,
                name: name,
                children: [
                    /*#__PURE__*/ jsx(Checkbox, {
                        checked: value,
                        disabled: disabled,
                        onCheckedChange: handleChange,
                        children: label
                    }),
                    /*#__PURE__*/ jsx(Field.Hint, {})
                ]
            }),
            /*#__PURE__*/ jsx(Dialog.Root, {
                open: showWarning,
                onOpenChange: (isOpen)=>setShowWarning(isOpen),
                children: /*#__PURE__*/ jsx(ConfirmDialog, {
                    endAction: /*#__PURE__*/ jsx(Button, {
                        onClick: handleConfirm,
                        variant: "danger",
                        width: "100%",
                        justifyContent: "center",
                        children: formatMessage({
                            id: getTrad('popUpWarning.draft-publish.button.confirm'),
                            defaultMessage: 'Yes, disable'
                        })
                    }),
                    children: formatMessage({
                        id: getTrad('popUpWarning.draft-publish.message'),
                        defaultMessage: 'If you disable the draft & publish, your drafts will be deleted.'
                    })
                })
            })
        ]
    });
};

export { DraftAndPublishToggle };
//# sourceMappingURL=DraftAndPublishToggle.mjs.map
