import { jsxs, jsx } from 'react/jsx-runtime';
import { Tr, Td, Typography, Flex, Box, IconButton } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const RoleRow = ({ id, name, description, usersCount, icons, rowIndex, canUpdate, cursor })=>{
    const { formatMessage } = useIntl();
    const [, editObject] = icons;
    const usersCountText = formatMessage({
        id: `Roles.RoleRow.user-count`,
        defaultMessage: '{number, plural, =0 {#  user} one {#  user} other {# users}}'
    }, {
        number: usersCount
    });
    return /*#__PURE__*/ jsxs(Tr, {
        cursor: cursor,
        "aria-rowindex": rowIndex,
        // @ts-expect-error – the prop uses `HTMLButtonElement` but we just specify `HTMLElement`
        onClick: canUpdate ? editObject.onClick : undefined,
        children: [
            /*#__PURE__*/ jsx(Td, {
                maxWidth: `13rem`,
                children: /*#__PURE__*/ jsx(Typography, {
                    ellipsis: true,
                    textColor: "neutral800",
                    children: name
                })
            }),
            /*#__PURE__*/ jsx(Td, {
                maxWidth: `25rem`,
                children: /*#__PURE__*/ jsx(Typography, {
                    ellipsis: true,
                    textColor: "neutral800",
                    children: description
                })
            }),
            /*#__PURE__*/ jsx(Td, {
                children: /*#__PURE__*/ jsx(Typography, {
                    textColor: "neutral800",
                    children: usersCountText
                })
            }),
            /*#__PURE__*/ jsx(Td, {
                children: /*#__PURE__*/ jsx(Flex, {
                    justifyContent: "flex-end",
                    onClick: (e)=>e.stopPropagation(),
                    children: icons.map((icon, i)=>{
                        if (icon) {
                            return /*#__PURE__*/ jsx(Box, {
                                paddingLeft: i === 0 ? 0 : 1,
                                children: /*#__PURE__*/ jsx(IconButton, {
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

export { RoleRow };
//# sourceMappingURL=RoleRow.mjs.map
