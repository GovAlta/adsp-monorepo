'use strict';

var getTrad = require('../../../utils/getTrad.js');
var componentForm = require('../component/componentForm.js');
var attributeOptions = require('./attributeOptions.js');

const conditionSection = {
    sectionTitle: {
        id: getTrad.getTrad('form.attribute.condition.title'),
        defaultMessage: 'Condition'
    },
    intlLabel: {
        id: getTrad.getTrad('form.attribute.condition.description'),
        defaultMessage: 'Toggle field settings depending on the value of another boolean or enumeration field.'
    },
    items: [
        {
            name: 'conditions',
            type: 'condition-form',
            intlLabel: {
                id: getTrad.getTrad('form.attribute.condition.label'),
                defaultMessage: 'Conditions'
            },
            validations: {
                required: true
            }
        }
    ]
};
const advancedForm = {
    blocks () {
        return {
            sections: [
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    boolean () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        {
                            autoFocus: true,
                            type: 'select-default-boolean',
                            intlLabel: {
                                id: getTrad.getTrad('form.attribute.settings.default'),
                                defaultMessage: 'Default value'
                            },
                            name: 'default',
                            options: [
                                {
                                    value: 'true',
                                    key: 'true',
                                    metadatas: {
                                        intlLabel: {
                                            id: 'true',
                                            defaultMessage: 'true'
                                        }
                                    }
                                },
                                {
                                    value: '',
                                    key: 'null',
                                    metadatas: {
                                        intlLabel: {
                                            id: 'null',
                                            defaultMessage: 'null'
                                        }
                                    }
                                },
                                {
                                    value: 'false',
                                    key: 'false',
                                    metadatas: {
                                        intlLabel: {
                                            id: 'false',
                                            defaultMessage: 'false'
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    component ({ repeatable }, step) {
        if (step === '1') {
            return {
                sections: componentForm.componentForm.advanced()
            };
        }
        if (repeatable) {
            const minComponentsAttribute = {
                ...attributeOptions.attributeOptions.min,
                intlLabel: {
                    id: getTrad.getTrad('form.attribute.item.minimumComponents'),
                    defaultMessage: 'Minimum components'
                }
            };
            const maxComponentsAttribute = {
                ...attributeOptions.attributeOptions.max,
                intlLabel: {
                    id: getTrad.getTrad('form.attribute.item.maximumComponents'),
                    defaultMessage: 'Maximum components'
                }
            };
            return {
                sections: [
                    {
                        sectionTitle: {
                            id: 'global.settings',
                            defaultMessage: 'Settings'
                        },
                        items: [
                            attributeOptions.attributeOptions.required,
                            attributeOptions.attributeOptions.private,
                            minComponentsAttribute,
                            maxComponentsAttribute
                        ]
                    },
                    conditionSection
                ]
            };
        }
        return {
            sections: [
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    date ({ type }) {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        {
                            ...attributeOptions.attributeOptions.default,
                            type: type || 'date',
                            value: null,
                            withDefaultValue: false,
                            disabled: !type,
                            autoFocus: false
                        }
                    ]
                },
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.unique,
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    dynamiczone () {
        return {
            sections: [
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.max,
                        attributeOptions.attributeOptions.min
                    ]
                },
                conditionSection
            ]
        };
    },
    email () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        {
                            ...attributeOptions.attributeOptions.default,
                            type: 'email'
                        }
                    ]
                },
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.unique,
                        attributeOptions.attributeOptions.maxLength,
                        attributeOptions.attributeOptions.minLength,
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    enumeration (data) {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        {
                            name: 'default',
                            type: 'select',
                            intlLabel: {
                                id: getTrad.getTrad('form.attribute.settings.default'),
                                defaultMessage: 'Default value'
                            },
                            validations: {},
                            options: [
                                {
                                    key: '__null_reset_value__',
                                    value: '',
                                    metadatas: {
                                        intlLabel: {
                                            id: 'components.InputSelect.option.placeholder',
                                            defaultMessage: 'Choose here'
                                        }
                                    }
                                },
                                ...(data.enum || []).filter((value, index)=>data.enum.indexOf(value) === index && value).map((value)=>{
                                    return {
                                        key: value,
                                        value,
                                        metadatas: {
                                            intlLabel: {
                                                id: `${value}.no-override`,
                                                defaultMessage: value
                                            }
                                        }
                                    };
                                })
                            ]
                        },
                        {
                            intlLabel: {
                                id: getTrad.getTrad('form.attribute.item.enumeration.graphql'),
                                defaultMessage: 'Name override for GraphQL'
                            },
                            name: 'enumName',
                            type: 'text',
                            validations: {},
                            description: {
                                id: getTrad.getTrad('form.attribute.item.enumeration.graphql.description'),
                                defaultMessage: 'Allows you to override the default generated name for GraphQL'
                            }
                        }
                    ]
                },
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    json () {
        return {
            sections: [
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    media () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        {
                            intlLabel: {
                                id: getTrad.getTrad('form.attribute.media.allowed-types'),
                                defaultMessage: 'Select allowed types of media'
                            },
                            name: 'allowedTypes',
                            type: 'allowed-types-select',
                            size: 7,
                            value: '',
                            validations: {}
                        }
                    ]
                },
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    number (data) {
        const inputStep = data.type === 'decimal' || data.type === 'float' ? 'any' : 1;
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        {
                            autoFocus: true,
                            name: 'default',
                            type: data.type === 'biginteger' ? 'text' : 'number',
                            step: inputStep,
                            intlLabel: {
                                id: getTrad.getTrad('form.attribute.settings.default'),
                                defaultMessage: 'Default value'
                            },
                            validations: {}
                        }
                    ]
                },
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.unique,
                        attributeOptions.attributeOptions.max,
                        attributeOptions.attributeOptions.min,
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    password () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        attributeOptions.attributeOptions.default
                    ]
                },
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.maxLength,
                        attributeOptions.attributeOptions.minLength,
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    relation () {
        return {
            sections: [
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    richtext () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        attributeOptions.attributeOptions.default
                    ]
                },
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.maxLength,
                        attributeOptions.attributeOptions.minLength,
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    text () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        attributeOptions.attributeOptions.default,
                        attributeOptions.attributeOptions.regex
                    ]
                },
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.unique,
                        attributeOptions.attributeOptions.maxLength,
                        attributeOptions.attributeOptions.minLength,
                        attributeOptions.attributeOptions.private
                    ]
                },
                conditionSection
            ]
        };
    },
    uid (data) {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        {
                            ...attributeOptions.attributeOptions.default,
                            disabled: Boolean(data.targetField),
                            type: 'text'
                        }
                    ]
                },
                {
                    sectionTitle: {
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    },
                    items: [
                        attributeOptions.attributeOptions.required,
                        attributeOptions.attributeOptions.maxLength,
                        attributeOptions.attributeOptions.minLength,
                        attributeOptions.attributeOptions.private,
                        attributeOptions.attributeOptions.regex
                    ]
                },
                conditionSection
            ]
        };
    }
};

exports.advancedForm = advancedForm;
//# sourceMappingURL=advancedForm.js.map
