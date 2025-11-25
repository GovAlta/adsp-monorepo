'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var AttributeOption = require('./AttributeOption.js');

const AttributeList = ({ attributes })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.KeyboardNavigable, {
        tagName: "button",
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 8,
            children: attributes.map((attributeRow, index)=>{
                return(// eslint-disable-next-line react/no-array-index-key
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                    gap: 3,
                    children: attributeRow.map((attribute)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsx(AttributeOption.AttributeOption, {
                                type: attribute
                            })
                        }, attribute))
                }, index));
            })
        })
    });

exports.AttributeList = AttributeList;
//# sourceMappingURL=AttributeList.js.map
