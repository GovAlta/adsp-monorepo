'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');

const RoleRow = ({ id, name, description, usersCount, icons, rowIndex, canUpdate, cursor })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [, editObject] = icons;
    const usersCountText = formatMessage({
        id: `Roles.RoleRow.user-count`,
        defaultMessage: '{number, plural, =0 {#  user} one {#  user} other {# users}}'
    }, {
        number: usersCount
    });
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
        cursor: cursor,
        "aria-rowindex": rowIndex,
        // @ts-expect-error – the prop uses `HTMLButtonElement` but we just specify `HTMLElement`
        onClick: canUpdate ? editObject.onClick : undefined,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                maxWidth: `13rem`,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    ellipsis: true,
                    textColor: "neutral800",
                    children: name
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                maxWidth: `25rem`,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    ellipsis: true,
                    textColor: "neutral800",
                    children: description
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    textColor: "neutral800",
                    children: usersCountText
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                    justifyContent: "flex-end",
                    onClick: (e)=>e.stopPropagation(),
                    children: icons.map((icon, i)=>{
                        if (icon) {
                            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                paddingLeft: i === 0 ? 0 : 1,
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    ...icon,
                                    variant: "ghost"
                                })
                            }, icon.label);
                        }
                        return null;
                    })
                })
            })
        ]
    }, id);
};

exports.RoleRow = RoleRow;
//# sourceMappingURL=RoleRow.js.map
