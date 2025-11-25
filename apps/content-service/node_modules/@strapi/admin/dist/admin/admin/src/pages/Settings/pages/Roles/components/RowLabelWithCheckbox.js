'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var constants = require('../utils/constants.js');
var CollapseLabel = require('./CollapseLabel.js');

const RowLabelWithCheckbox = ({ checkboxName = '', children, isActive = false, isCollapsable = false, isFormDisabled = false, label, onChange, onClick, someChecked = false, value })=>{
    const { formatMessage } = reactIntl.useIntl();
    const collapseLabelProps = {
        title: label,
        alignItems: 'center',
        $isCollapsable: isCollapsable
    };
    if (isCollapsable) {
        Object.assign(collapseLabelProps, {
            onClick,
            'aria-expanded': isActive,
            onKeyDown ({ key }) {
                if (key === 'Enter' || key === ' ') {
                    onClick();
                }
            },
            tabIndex: 0,
            role: 'button'
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        alignItems: "center",
        paddingLeft: 6,
        width: constants.firstRowWidth,
        shrink: 0,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                paddingRight: 2,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                    name: checkboxName,
                    "aria-label": formatMessage({
                        id: `Settings.permissions.select-all-by-permission`,
                        defaultMessage: 'Select all {label} permissions'
                    }, {
                        label
                    }),
                    disabled: isFormDisabled,
                    // Keep same signature as packages/core/admin/admin/src/components/Roles/Permissions/index.js l.91
                    onCheckedChange: (value)=>onChange({
                            target: {
                                name: checkboxName,
                                value: !!value
                            }
                        }),
                    checked: someChecked ? 'indeterminate' : value
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(CollapseLabel.CollapseLabel, {
                ...collapseLabelProps,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        ellipsis: true,
                        children: label
                    }),
                    children
                ]
            })
        ]
    });
};

exports.RowLabelWithCheckbox = RowLabelWithCheckbox;
//# sourceMappingURL=RowLabelWithCheckbox.js.map
