import { jsx } from 'react/jsx-runtime';
import { KeyboardNavigable, Flex, Grid } from '@strapi/design-system';
import { AttributeOption } from './AttributeOption.mjs';

const AttributeList = ({ attributes })=>/*#__PURE__*/ jsx(KeyboardNavigable, {
        tagName: "button",
        children: /*#__PURE__*/ jsx(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 8,
            children: attributes.map((attributeRow, index)=>{
                return(// eslint-disable-next-line react/no-array-index-key
                /*#__PURE__*/ jsx(Grid.Root, {
                    gap: 3,
                    children: attributeRow.map((attribute)=>/*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(AttributeOption, {
                                type: attribute
                            })
                        }, attribute))
                }, index));
            })
        })
    });

export { AttributeList };
//# sourceMappingURL=AttributeList.mjs.map
