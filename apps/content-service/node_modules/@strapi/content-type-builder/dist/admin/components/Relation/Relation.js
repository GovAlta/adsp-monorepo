'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var getRelationType = require('../../utils/getRelationType.js');
var RelationField = require('./RelationField/RelationField.js');
var RelationNaturePicker = require('./RelationNaturePicker/RelationNaturePicker.js');

const Relation = ({ formErrors, mainBoxHeader, modifiedData, naturePickerType, onChange, targetUid })=>{
    const relationType = getRelationType.getRelationType(modifiedData.relation, modifiedData.targetAttribute);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        style: {
            position: 'relative'
        },
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(RelationField.RelationFormBox, {
                isMain: true,
                header: mainBoxHeader,
                error: formErrors?.name || null,
                name: "name",
                onChange: onChange,
                value: modifiedData?.name || ''
            }),
            /*#__PURE__*/ jsxRuntime.jsx(RelationNaturePicker.RelationNaturePicker, {
                naturePickerType: naturePickerType,
                oneThatIsCreatingARelationWithAnother: mainBoxHeader,
                relationType: relationType,
                target: modifiedData.target,
                targetUid: targetUid
            }),
            /*#__PURE__*/ jsxRuntime.jsx(RelationField.RelationFormBox, {
                disabled: [
                    'oneWay',
                    'manyWay'
                ].includes(relationType),
                error: formErrors?.targetAttribute || null,
                name: "targetAttribute",
                onChange: onChange,
                oneThatIsCreatingARelationWithAnother: mainBoxHeader,
                target: modifiedData.target,
                value: modifiedData?.targetAttribute || ''
            })
        ]
    });
};

exports.Relation = Relation;
//# sourceMappingURL=Relation.js.map
