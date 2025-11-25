import { getTrad } from '../../../utils/getTrad.mjs';
import { commonBaseForm } from '../attributes/commonBaseForm.mjs';
import { attributesForm } from '../attributes/form.mjs';
import { nameField } from '../attributes/nameField.mjs';
import { attributeTypes } from '../attributes/types.mjs';
import { componentForm } from '../component/componentForm.mjs';
import { createComponentSchema } from '../component/createComponentSchema.mjs';
import { contentTypeForm } from '../contentType/contentTypeForm.mjs';
import { createContentTypeSchema } from '../contentType/createContentTypeSchema.mjs';
import { dynamiczoneForm } from '../dynamiczoneForm.mjs';
import { addItemsToFormSection } from './utils/addItemsToFormSection.mjs';
import { createComponentCollectionName } from './utils/createCollectionName.mjs';
import { getUsedAttributeNames } from './utils/getUsedAttributeNames.mjs';

const forms = {
    customField: {
        schema ({ schemaAttributes, attributeType, customFieldValidator, reservedNames, schemaData, ctbFormsAPI }) {
            const usedAttributeNames = getUsedAttributeNames(schemaAttributes, schemaData);
            let attributeShape;
            if (attributeType === 'relation') {
                attributeShape = attributeTypes[attributeType](usedAttributeNames, reservedNames.attributes, [], {
                    initialData: {},
                    modifiedData: {}
                });
            } else {
                attributeShape = attributeTypes[attributeType](usedAttributeNames, reservedNames.attributes);
            }
            return ctbFormsAPI.makeCustomFieldValidator(attributeShape, customFieldValidator, usedAttributeNames, reservedNames.attributes, schemaData);
        },
        form: {
            base ({ customField }) {
                // Default section with required name field
                const sections = [
                    {
                        sectionTitle: null,
                        items: [
                            nameField
                        ]
                    }
                ];
                if (customField.options?.base) {
                    addItemsToFormSection(customField.options.base, sections);
                }
                return {
                    sections
                };
            },
            advanced ({ customField, data, step, extensions, ...rest }) {
                // Default section with no fields
                const sections = [
                    {
                        sectionTitle: null,
                        items: []
                    },
                    {
                        sectionTitle: {
                            id: 'form.attribute.condition.section',
                            defaultMessage: 'Conditions'
                        },
                        items: [
                            {
                                name: 'conditions',
                                type: 'condition-form',
                                intlLabel: {
                                    id: 'form.attribute.condition.label',
                                    defaultMessage: 'Visibility condition'
                                },
                                description: {
                                    id: 'form.attribute.condition.desc',
                                    defaultMessage: 'Show this field only when a boolean/enum condition matches.'
                                }
                            }
                        ]
                    }
                ];
                const injectedInputs = extensions.getAdvancedForm([
                    'attribute',
                    customField.type
                ], {
                    data,
                    type: customField.type,
                    step,
                    ...rest
                });
                if (customField.options?.advanced) {
                    addItemsToFormSection(customField.options.advanced, sections);
                }
                if (injectedInputs) {
                    const extendedSettings = {
                        sectionTitle: {
                            id: getTrad('modalForm.custom-fields.advanced.settings.extended'),
                            defaultMessage: 'Extended settings'
                        },
                        items: injectedInputs
                    };
                    sections.push(extendedSettings);
                }
                return {
                    sections
                };
            }
        }
    },
    attribute: {
        schema (currentSchema, attributeType, reservedNames, alreadyTakenTargetContentTypeAttributes, options, extensions) {
            // Get the attributes object on the schema
            const attributes = currentSchema?.attributes ?? [];
            const usedAttributeNames = getUsedAttributeNames(attributes, options);
            try {
                const attributeShape = attributeTypes[attributeType](usedAttributeNames, reservedNames.attributes, alreadyTakenTargetContentTypeAttributes, options);
                return extensions.makeValidator([
                    'attribute',
                    attributeType
                ], attributeShape, usedAttributeNames, reservedNames.attributes, alreadyTakenTargetContentTypeAttributes, options);
            } catch (err) {
                console.error('Error yup build schema', err);
                return attributeTypes.default(usedAttributeNames, reservedNames.attributes);
            }
        },
        form: {
            advanced ({ data, type, step, extensions, ...rest }) {
                try {
                    const baseForm = attributesForm.advanced[type](data, step).sections;
                    const itemsToAdd = extensions.getAdvancedForm([
                        'attribute',
                        type
                    ], {
                        data,
                        type,
                        step,
                        ...rest
                    });
                    let injected = false;
                    const sections = baseForm.reduce((acc, current)=>{
                        if (current.sectionTitle === null || injected) {
                            acc.push(current);
                        } else {
                            acc.push({
                                ...current,
                                items: [
                                    ...current.items,
                                    ...itemsToAdd
                                ]
                            });
                            injected = true;
                        }
                        return acc;
                    }, []);
                    // IF we want a dedicated section for the plugins
                    // const sections = [
                    //   ...baseForm,
                    //   {
                    //     sectionTitle: { id: 'Zone pour plugins', defaultMessage: 'Zone pour plugins' },
                    //     items: itemsToAdd,
                    //   },
                    // ];
                    return {
                        sections
                    };
                } catch (err) {
                    console.error(err);
                    return {
                        sections: []
                    };
                }
            },
            base ({ data, type, step, attributes }) {
                try {
                    return attributesForm.base[type](data, step, attributes);
                } catch (err) {
                    return commonBaseForm;
                }
            }
        }
    },
    contentType: {
        schema (alreadyTakenNames, isEditing, ctUid, reservedNames, extensions, contentTypes) {
            const singularNames = Object.values(contentTypes).map((contentType)=>{
                return contentType.info.singularName;
            });
            const pluralNames = Object.values(contentTypes).map((contentType)=>{
                return contentType?.info?.pluralName ?? '';
            });
            const takenNames = isEditing ? alreadyTakenNames.filter((uid)=>uid !== ctUid) : alreadyTakenNames;
            const takenSingularNames = isEditing ? singularNames.filter((singName)=>{
                const { info } = contentTypes[ctUid];
                return info.singularName !== singName;
            }) : singularNames;
            const takenPluralNames = isEditing ? pluralNames.filter((pluralName)=>{
                const { info } = contentTypes[ctUid];
                return info.pluralName !== pluralName;
            }) : pluralNames;
            // return the array of collection names not all normalized
            const collectionNames = Object.values(contentTypes).map((contentType)=>{
                return contentType?.collectionName ?? '';
            });
            const takenCollectionNames = isEditing ? collectionNames.filter((collectionName)=>{
                const { collectionName: currentCollectionName } = contentTypes[ctUid];
                return collectionName !== currentCollectionName;
            }) : collectionNames;
            const contentTypeShape = createContentTypeSchema({
                usedContentTypeNames: takenNames,
                reservedModels: reservedNames.models,
                singularNames: takenSingularNames,
                pluralNames: takenPluralNames,
                collectionNames: takenCollectionNames
            });
            // FIXME
            return extensions.makeValidator([
                'contentType'
            ], contentTypeShape, takenNames, reservedNames.models, takenSingularNames, takenPluralNames);
        },
        form: {
            base ({ actionType }) {
                if (actionType === 'create') {
                    return contentTypeForm.base.create();
                }
                return contentTypeForm.base.edit();
            },
            advanced ({ extensions }) {
                const baseForm = contentTypeForm.advanced.default().sections.map((section)=>section.items).flat();
                const itemsToAdd = extensions.getAdvancedForm([
                    'contentType'
                ]);
                return {
                    sections: [
                        {
                            items: [
                                ...baseForm,
                                ...itemsToAdd
                            ]
                        }
                    ]
                };
            }
        }
    },
    component: {
        schema (alreadyTakenAttributes, componentCategory, reservedNames, isEditing = false, components, componentDisplayName, compoUid = null) {
            const takenNames = isEditing ? alreadyTakenAttributes.filter((uid)=>uid !== compoUid) : alreadyTakenAttributes;
            const collectionNames = Object.values(components).map((component)=>{
                return component?.collectionName;
            });
            const currentCollectionName = createComponentCollectionName(componentDisplayName, componentCategory);
            const takenCollectionNames = isEditing ? collectionNames.filter((collectionName)=>collectionName !== currentCollectionName) : collectionNames;
            return createComponentSchema(takenNames, reservedNames.models, componentCategory, takenCollectionNames, currentCollectionName);
        },
        form: {
            advanced () {
                return {
                    sections: componentForm.advanced()
                };
            },
            base () {
                return {
                    sections: componentForm.base()
                };
            }
        }
    },
    addComponentToDynamicZone: {
        form: {
            advanced () {
                return dynamiczoneForm.advanced.default();
            },
            base ({ data }) {
                const isCreatingComponent = data?.createComponent ?? false;
                if (isCreatingComponent) {
                    return dynamiczoneForm.base.createComponent();
                }
                return dynamiczoneForm.base.default();
            }
        }
    }
};

export { forms };
//# sourceMappingURL=forms.mjs.map
