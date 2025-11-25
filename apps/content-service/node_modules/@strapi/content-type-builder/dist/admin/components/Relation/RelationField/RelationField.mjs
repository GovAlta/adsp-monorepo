import { jsxs, jsx } from 'react/jsx-runtime';
import { Box, Flex, Typography, Divider } from '@strapi/design-system';
import { getTrad } from '../../../utils/getTrad.mjs';
import { GenericInput as MemoizedGenericInput } from '../../GenericInputs.mjs';
import { RelationTargetPicker } from './RelationTargetPicker/RelationTargetPicker.mjs';

const RelationFormBox = ({ disabled = false, error, header, isMain = false, name, onChange, oneThatIsCreatingARelationWithAnother = '', target, value = '' })=>{
    return /*#__PURE__*/ jsxs(Box, {
        background: "neutral100",
        hasRadius: true,
        borderColor: "neutral200",
        children: [
            /*#__PURE__*/ jsx(Flex, {
                paddingTop: isMain ? 4 : 1,
                paddingBottom: isMain ? 3 : 1,
                justifyContent: "center",
                children: isMain ? /*#__PURE__*/ jsx(Typography, {
                    variant: "pi",
                    fontWeight: "bold",
                    textColor: "neutral800",
                    children: header
                }) : /*#__PURE__*/ jsx(RelationTargetPicker, {
                    target: target,
                    oneThatIsCreatingARelationWithAnother: oneThatIsCreatingARelationWithAnother
                })
            }),
            /*#__PURE__*/ jsx(Divider, {
                background: "neutral200"
            }),
            /*#__PURE__*/ jsx(Box, {
                padding: 4,
                children: /*#__PURE__*/ jsx(MemoizedGenericInput, {
                    disabled: disabled,
                    error: error?.id || null,
                    intlLabel: {
                        id: getTrad('form.attribute.item.defineRelation.fieldName'),
                        defaultMessage: 'Field name'
                    },
                    name: name,
                    onChange: onChange,
                    type: "text",
                    value: value
                })
            })
        ]
    });
};

export { RelationFormBox };
//# sourceMappingURL=RelationField.mjs.map
