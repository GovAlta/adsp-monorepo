'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var getTrad = require('../../../utils/getTrad.js');
var GenericInputs = require('../../GenericInputs.js');
var RelationTargetPicker = require('./RelationTargetPicker/RelationTargetPicker.js');

const RelationFormBox = ({ disabled = false, error, header, isMain = false, name, onChange, oneThatIsCreatingARelationWithAnother = '', target, value = '' })=>{
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
        background: "neutral100",
        hasRadius: true,
        borderColor: "neutral200",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                paddingTop: isMain ? 4 : 1,
                paddingBottom: isMain ? 3 : 1,
                justifyContent: "center",
                children: isMain ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    variant: "pi",
                    fontWeight: "bold",
                    textColor: "neutral800",
                    children: header
                }) : /*#__PURE__*/ jsxRuntime.jsx(RelationTargetPicker.RelationTargetPicker, {
                    target: target,
                    oneThatIsCreatingARelationWithAnother: oneThatIsCreatingARelationWithAnother
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Divider, {
                background: "neutral200"
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                padding: 4,
                children: /*#__PURE__*/ jsxRuntime.jsx(GenericInputs.GenericInput, {
                    disabled: disabled,
                    error: error?.id || null,
                    intlLabel: {
                        id: getTrad.getTrad('form.attribute.item.defineRelation.fieldName'),
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

exports.RelationFormBox = RelationFormBox;
//# sourceMappingURL=RelationField.js.map
