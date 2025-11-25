import { jsxs, jsx } from 'react/jsx-runtime';
import { Flex } from '@strapi/design-system';
import { getRelationType } from '../../utils/getRelationType.mjs';
import { RelationFormBox } from './RelationField/RelationField.mjs';
import { RelationNaturePicker } from './RelationNaturePicker/RelationNaturePicker.mjs';

const Relation = ({ formErrors, mainBoxHeader, modifiedData, naturePickerType, onChange, targetUid })=>{
    const relationType = getRelationType(modifiedData.relation, modifiedData.targetAttribute);
    return /*#__PURE__*/ jsxs(Flex, {
        style: {
            position: 'relative'
        },
        children: [
            /*#__PURE__*/ jsx(RelationFormBox, {
                isMain: true,
                header: mainBoxHeader,
                error: formErrors?.name || null,
                name: "name",
                onChange: onChange,
                value: modifiedData?.name || ''
            }),
            /*#__PURE__*/ jsx(RelationNaturePicker, {
                naturePickerType: naturePickerType,
                oneThatIsCreatingARelationWithAnother: mainBoxHeader,
                relationType: relationType,
                target: modifiedData.target,
                targetUid: targetUid
            }),
            /*#__PURE__*/ jsx(RelationFormBox, {
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

export { Relation };
//# sourceMappingURL=Relation.mjs.map
