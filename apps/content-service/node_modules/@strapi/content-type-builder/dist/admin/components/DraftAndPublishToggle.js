'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var getTrad = require('../utils/getTrad.js');

const DraftAndPublishToggle = ({ description, disabled = false, intlLabel, isCreating, name, onChange, value = false })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [showWarning, setShowWarning] = React.useState(false);
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
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                hint: hint,
                name: name,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                        checked: value,
                        disabled: disabled,
                        onCheckedChange: handleChange,
                        children: label
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {})
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
                open: showWarning,
                onOpenChange: (isOpen)=>setShowWarning(isOpen),
                children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
                    endAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        onClick: handleConfirm,
                        variant: "danger",
                        width: "100%",
                        justifyContent: "center",
                        children: formatMessage({
                            id: getTrad.getTrad('popUpWarning.draft-publish.button.confirm'),
                            defaultMessage: 'Yes, disable'
                        })
                    }),
                    children: formatMessage({
                        id: getTrad.getTrad('popUpWarning.draft-publish.message'),
                        defaultMessage: 'If you disable the draft & publish, your drafts will be deleted.'
                    })
                })
            })
        ]
    });
};

exports.DraftAndPublishToggle = DraftAndPublishToggle;
//# sourceMappingURL=DraftAndPublishToggle.js.map
