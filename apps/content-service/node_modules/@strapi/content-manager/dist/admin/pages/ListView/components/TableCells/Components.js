'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var CellValue = require('./CellValue.js');

const SingleComponent = ({ content, mainField })=>{
    if (!mainField) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
        label: content[mainField.name],
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
            maxWidth: "25rem",
            textColor: "neutral800",
            ellipsis: true,
            children: /*#__PURE__*/ jsxRuntime.jsx(CellValue.CellValue, {
                type: mainField.type,
                value: content[mainField.name]
            })
        })
    });
};
const RepeatableComponent = ({ content, mainField })=>{
    const { formatMessage } = reactIntl.useIntl();
    if (!mainField) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Root, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Trigger, {
                onClick: (e)=>e.stopPropagation(),
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Badge, {
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
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Content, {
                children: content.map((item)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                        disabled: true,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            maxWidth: "50rem",
                            ellipsis: true,
                            children: /*#__PURE__*/ jsxRuntime.jsx(CellValue.CellValue, {
                                type: mainField.type,
                                value: item[mainField.name]
                            })
                        })
                    }, item.id))
            })
        ]
    });
};

exports.RepeatableComponent = RepeatableComponent;
exports.SingleComponent = SingleComponent;
//# sourceMappingURL=Components.js.map
