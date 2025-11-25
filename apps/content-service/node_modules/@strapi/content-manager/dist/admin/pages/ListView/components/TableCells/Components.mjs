import { jsx, jsxs } from 'react/jsx-runtime';
import { Tooltip, Typography, Menu, Badge } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { CellValue } from './CellValue.mjs';

const SingleComponent = ({ content, mainField })=>{
    if (!mainField) {
        return null;
    }
    return /*#__PURE__*/ jsx(Tooltip, {
        label: content[mainField.name],
        children: /*#__PURE__*/ jsx(Typography, {
            maxWidth: "25rem",
            textColor: "neutral800",
            ellipsis: true,
            children: /*#__PURE__*/ jsx(CellValue, {
                type: mainField.type,
                value: content[mainField.name]
            })
        })
    });
};
const RepeatableComponent = ({ content, mainField })=>{
    const { formatMessage } = useIntl();
    if (!mainField) {
        return null;
    }
    return /*#__PURE__*/ jsxs(Menu.Root, {
        children: [
            /*#__PURE__*/ jsxs(Menu.Trigger, {
                onClick: (e)=>e.stopPropagation(),
                children: [
                    /*#__PURE__*/ jsx(Badge, {
                        children: content.length
                    }),
                    formatMessage({
                        id: 'content-manager.containers.list.items',
                        defaultMessage: '{number, plural, =0 {items} one {item} other {items}}'
                    }, {
                        number: content.length
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Menu.Content, {
                children: content.map((item)=>/*#__PURE__*/ jsx(Menu.Item, {
                        disabled: true,
                        children: /*#__PURE__*/ jsx(Typography, {
                            maxWidth: "50rem",
                            ellipsis: true,
                            children: /*#__PURE__*/ jsx(CellValue, {
                                type: mainField.type,
                                value: item[mainField.name]
                            })
                        })
                    }, item.id))
            })
        ]
    });
};

export { RepeatableComponent, SingleComponent };
//# sourceMappingURL=Components.mjs.map
