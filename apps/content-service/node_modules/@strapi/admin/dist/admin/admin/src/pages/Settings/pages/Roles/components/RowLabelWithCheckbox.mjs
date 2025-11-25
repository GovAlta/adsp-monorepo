import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { Flex, Box, Checkbox, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { firstRowWidth } from '../utils/constants.mjs';
import { CollapseLabel } from './CollapseLabel.mjs';

const RowLabelWithCheckbox = ({ checkboxName = '', children, isActive = false, isCollapsable = false, isFormDisabled = false, label, onChange, onClick, someChecked = false, value })=>{
    const { formatMessage } = useIntl();
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
    return /*#__PURE__*/ jsxs(Flex, {
        alignItems: "center",
        paddingLeft: 6,
        width: firstRowWidth,
        shrink: 0,
        children: [
            /*#__PURE__*/ jsx(Box, {
                paddingRight: 2,
                children: /*#__PURE__*/ jsx(Checkbox, {
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
            /*#__PURE__*/ jsxs(CollapseLabel, {
                ...collapseLabelProps,
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        ellipsis: true,
                        children: label
                    }),
                    children
                ]
            })
        ]
    });
};

export { RowLabelWithCheckbox };
//# sourceMappingURL=RowLabelWithCheckbox.mjs.map
