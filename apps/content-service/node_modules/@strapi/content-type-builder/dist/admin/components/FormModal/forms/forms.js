'use strict';

var getTrad = require('../../../utils/getTrad.js');
var commonBaseForm = require('../attributes/commonBaseForm.js');
var form = require('../attributes/form.js');
var nameField = require('../attributes/nameField.js');
var types = require('../attributes/types.js');
var componentForm = require('../component/componentForm.js');
var createComponentSchema = require('../component/createComponentSchema.js');
var contentTypeForm = require('../contentType/contentTypeForm.js');
var createContentTypeSchema = require('../contentType/createContentTypeSchema.js');
var dynamiczoneForm = require('../dynamiczoneForm.js');
var addItemsToFormSection = require('./utils/addItemsToFormSection.js');
var createCollectionName = require('./utils/createCollectionName.js');
var getUsedAttributeNames = require('./utils/getUsedAttributeNames.js');

const forms = {
    customField: {
        schema ({ schemaAttributes, attributeType, customFieldValidator, reservedNames, schemaData, ctbFormsAPI }) {
            const usedAttributeNames = getUsedAttributeNames.getUsedAttributeNames(schemaAttributes, schemaData);
            let attributeShape;
            if (attributeType === 'relation') {
                attributeShape = types.attributeTypes[attributeType](usedAttributeNames, reservedNames.attributes, [], {
                    initialData: {},
                    modifiedData: {}
                });
            } else {
                attributeShape = types.attributeTypes[attributeType](usedAttributeNames, reservedNames.attributes);
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
                            nameField.nameField
                        ]
                    }
                ];
                if (customField.options?.base) {
                    addItemsToFormSection.addItemsToFormSection(customField.options.base, sections);
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
                    addItemsToFormSection.addItemsToFormSection(customField.options.advanced, sections);
                }
                if (injectedInputs) {
                    const extendedSettings = {
                        sectionTitle: {
                            id: getTrad.getTrad('modalForm.custom-fields.advanced.settings.extended'),
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
            const usedAttributeNames = getUsedAttributeNames.getUsedAttributeNames(attributes, options);
            try {
                const attributeShape = types.attributeTypes[attributeType](usedAttributeNames, reservedNames.attributes, alreadyTakenTargetContentTypeAttributes, options);
                return extensions.makeValidator([
                    'attribute',
                    attributeType
                ], attributeShape, usedAttributeNames, reservedNames.attributes, alreadyTakenTargetContentTypeAttributes, options);
            } catch (err) {
                console.error('Error yup build schema', err);
                return types.attributeTypes.default(usedAttributeNames, reservedNames.attributes);
            }
        },
        form: {
            advanced ({ data, type, step, extensions, ...rest }) {
                try {
                    const baseForm = form.attributesForm.advanced[type](data, step).sections;
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
                    return form.attributesForm.base[type](data, step, attributes);
                } catch (err) {
                    return commonBaseForm.commonBaseForm;
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
            const contentTypeShape = createContentTypeSchema.createContentTypeSchema({
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
                    return contentTypeForm.contentTypeForm.base.create();
                }
                return contentTypeForm.contentTypeForm.base.edit();
            },
            advanced ({ extensions }) {
                const baseForm = contentTypeForm.contentTypeForm.advanced.default().sections.map((section)=>section.items).flat();
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
            const currentCollectionName = createCollectionName.createComponentCollectionName(componentDisplayName, componentCategory);
            const takenCollectionNames = isEditing ? collectionNames.filter((collectionName)=>collectionName !== currentCollectionName) : collectionNames;
            return createComponentSchema.createComponentSchema(takenNames, reservedNames.models, componentCategory, takenCollectionNames, currentCollectionName);
        },
        form: {
            advanced () {
                return {
                    sections: componentForm.componentForm.advanced()
                };
            },
            base () {
                return {
                    sections: componentForm.componentForm.base()
                };
            }
        }
    },
    addComponentToDynamicZone: {
        form: {
            advanced () {
                return dynamiczoneForm.dynamiczoneForm.advanced.default();
            },
            base ({ data }) {
                const isCreatingComponent = data?.createComponent ?? false;
                if (isCreatingComponent) {
                    return dynamiczoneForm.dynamiczoneForm.base.createComponent();
                }
                return dynamiczoneForm.dynamiczoneForm.base.default();
            }
        }
    }
};

exports.forms = forms;
//# sourceMappingURL=forms.js.map
