'use strict';

var getTrad = require('../../../utils/getTrad.js');
var componentField = require('../component/componentField.js');
var componentForm = require('../component/componentForm.js');
var nameField = require('./nameField.js');

const baseForm = {
    component (data, step) {
        if (step === '1') {
            const itemsToConcat = data.createComponent === true ? componentForm.componentForm.base('componentToCreate.') : [];
            return {
                sections: [
                    {
                        sectionTitle: null,
                        items: [
                            componentField.componentField
                        ]
                    },
                    ...itemsToConcat
                ]
            };
        }
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        nameField.nameField,
                        {
                            name: 'component',
                            type: 'select-component',
                            intlLabel: {
                                id: getTrad.getTrad('modalForm.attributes.select-component'),
                                defaultMessage: 'Select a component'
                            },
                            isMultiple: false
                        }
                    ]
                },
                {
                    sectionTitle: null,
                    items: [
                        {
                            intlLabel: {
                                id: 'global.type',
                                defaultMessage: 'Type'
                            },
                            name: 'repeatable',
                            type: 'boolean-radio-group',
                            size: 12,
                            radios: [
                                {
                                    title: {
                                        id: getTrad.getTrad('form.attribute.component.option.repeatable'),
                                        defaultMessage: 'Repeatable component'
                                    },
                                    description: {
                                        id: getTrad.getTrad('form.attribute.component.option.repeatable.description'),
                                        defaultMessage: 'Best for multiple instances (array) of ingredients, meta tags, etc..'
                                    },
                                    value: true
                                },
                                {
                                    title: {
                                        id: getTrad.getTrad('form.attribute.component.option.single'),
                                        defaultMessage: 'Single component'
                                    },
                                    description: {
                                        id: getTrad.getTrad('form.attribute.component.option.single.description'),
                                        defaultMessage: 'Best for grouping fields like full address, main information, etc...'
                                    },
                                    value: false
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    },
    date () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        nameField.nameField,
                        {
                            intlLabel: {
                                id: 'global.type',
                                defaultMessage: 'Type'
                            },
                            name: 'type',
                            type: 'select-date',
                            options: [
                                {
                                    key: '__null_reset_value__',
                                    value: '',
                                    metadatas: {
                                        intlLabel: {
                                            id: 'components.InputSelect.option.placeholder',
                                            defaultMessage: 'Choose here'
                                        },
                                        hidden: true
                                    }
                                },
                                {
                                    key: 'date',
                                    value: 'date',
                                    metadatas: {
                                        intlLabel: {
                                            id: getTrad.getTrad('form.attribute.item.date.type.date'),
                                            defaultMessage: 'date (ex: 01/01/{currentYear})',
                                            values: {
                                                currentYear: new Date().getFullYear()
                                            }
                                        }
                                    }
                                },
                                {
                                    key: 'datetime',
                                    value: 'datetime',
                                    metadatas: {
                                        intlLabel: {
                                            id: getTrad.getTrad('form.attribute.item.date.type.datetime'),
                                            defaultMessage: 'datetime (ex: 01/01/{currentYear} 00:00 AM)',
                                            values: {
                                                currentYear: new Date().getFullYear()
                                            }
                                        }
                                    }
                                },
                                {
                                    key: 'time',
                                    value: 'time',
                                    metadatas: {
                                        intlLabel: {
                                            id: getTrad.getTrad('form.attribute.item.date.type.time'),
                                            defaultMessage: 'time (ex: 00:00 AM)'
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    },
    enumeration () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        nameField.nameField
                    ]
                },
                {
                    sectionTitle: null,
                    items: [
                        {
                            name: 'enum',
                            type: 'textarea-enum',
                            size: 6,
                            intlLabel: {
                                id: getTrad.getTrad('form.attribute.item.enumeration.rules'),
                                defaultMessage: 'Values (one line per value)'
                            },
                            placeholder: {
                                id: getTrad.getTrad('form.attribute.item.enumeration.placeholder'),
                                defaultMessage: 'Ex:\nmorning\nnoon\nevening'
                            },
                            validations: {
                                required: true
                            }
                        }
                    ]
                }
            ]
        };
    },
    media () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        nameField.nameField
                    ]
                },
                {
                    sectionTitle: null,
                    items: [
                        {
                            intlLabel: {
                                id: 'global.type',
                                defaultMessage: 'Type'
                            },
                            name: 'multiple',
                            size: 12,
                            type: 'boolean-radio-group',
                            radios: [
                                {
                                    title: {
                                        id: getTrad.getTrad('form.attribute.media.option.multiple'),
                                        defaultMessage: 'Multiple media'
                                    },
                                    description: {
                                        id: getTrad.getTrad('form.attribute.media.option.multiple.description'),
                                        defaultMessage: 'Best for sliders, carousels or multiple files download'
                                    },
                                    value: true
                                },
                                {
                                    title: {
                                        id: getTrad.getTrad('form.attribute.media.option.single'),
                                        defaultMessage: 'Single media'
                                    },
                                    description: {
                                        id: getTrad.getTrad('form.attribute.media.option.single.description'),
                                        defaultMessage: 'Best for avatar, profile picture or cover'
                                    },
                                    value: false
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    },
    number () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        nameField.nameField,
                        {
                            intlLabel: {
                                id: getTrad.getTrad('form.attribute.item.number.type'),
                                defaultMessage: 'Number format'
                            },
                            name: 'type',
                            type: 'select-number',
                            options: [
                                {
                                    key: '__null_reset_value__',
                                    value: '',
                                    metadatas: {
                                        intlLabel: {
                                            id: 'components.InputSelect.option.placeholder',
                                            defaultMessage: 'Choose here'
                                        },
                                        hidden: true
                                    }
                                },
                                {
                                    key: 'integer',
                                    value: 'integer',
                                    metadatas: {
                                        intlLabel: {
                                            id: getTrad.getTrad('form.attribute.item.number.type.integer'),
                                            defaultMessage: 'integer (ex: 10)'
                                        }
                                    }
                                },
                                {
                                    key: 'biginteger',
                                    value: 'biginteger',
                                    metadatas: {
                                        intlLabel: {
                                            id: getTrad.getTrad('form.attribute.item.number.type.biginteger'),
                                            defaultMessage: 'biginteger (ex: 123456789)'
                                        }
                                    }
                                },
                                {
                                    key: 'decimal',
                                    value: 'decimal',
                                    metadatas: {
                                        intlLabel: {
                                            id: getTrad.getTrad('form.attribute.item.number.type.decimal'),
                                            defaultMessage: 'decimal (ex: 2.22)'
                                        }
                                    }
                                },
                                {
                                    key: 'float',
                                    value: 'float',
                                    metadatas: {
                                        intlLabel: {
                                            id: getTrad.getTrad('form.attribute.item.number.type.float'),
                                            defaultMessage: 'decimal (ex: 3.3333333)'
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    },
    relation () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        {
                            intlLabel: {
                                id: 'FIXME',
                                defaultMessage: 'FIXME'
                            },
                            name: 'relation',
                            size: 12,
                            type: 'relation'
                        }
                    ]
                }
            ]
        };
    },
    string () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        nameField.nameField
                    ]
                },
                {
                    sectionTitle: null,
                    items: [
                        {
                            intlLabel: {
                                id: 'global.type',
                                defaultMessage: 'Type'
                            },
                            name: 'type',
                            size: 12,
                            type: 'radio-group',
                            radios: [
                                {
                                    title: {
                                        id: getTrad.getTrad('form.attribute.text.option.short-text'),
                                        defaultMessage: 'Sort text'
                                    },
                                    description: {
                                        id: getTrad.getTrad('form.attribute.text.option.short-text.description'),
                                        defaultMessage: 'Best for titles, names, links (URL). It also enables exact search on the field.'
                                    },
                                    value: 'string'
                                },
                                {
                                    title: {
                                        id: getTrad.getTrad('form.attribute.text.option.long-text'),
                                        defaultMessage: 'Long text'
                                    },
                                    description: {
                                        id: getTrad.getTrad('form.attribute.text.option.long-text.description'),
                                        defaultMessage: 'Best for descriptions, biography. Exact search is disabled.'
                                    },
                                    value: 'text'
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    },
    text () {
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        nameField.nameField
                    ]
                },
                {
                    sectionTitle: null,
                    items: [
                        {
                            intlLabel: {
                                id: 'global.type',
                                defaultMessage: 'Type'
                            },
                            name: 'type',
                            size: 12,
                            type: 'radio-group',
                            radios: [
                                {
                                    title: {
                                        id: getTrad.getTrad('form.attribute.text.option.short-text'),
                                        defaultMessage: 'Sort text'
                                    },
                                    description: {
                                        id: getTrad.getTrad('form.attribute.text.option.short-text.description'),
                                        defaultMessage: 'Best for titles, names, links (URL). It also enables exact search on the field.'
                                    },
                                    value: 'string'
                                },
                                {
                                    title: {
                                        id: getTrad.getTrad('form.attribute.text.option.long-text'),
                                        defaultMessage: 'Long text'
                                    },
                                    description: {
                                        id: getTrad.getTrad('form.attribute.text.option.long-text.description'),
                                        defaultMessage: 'Best for descriptions, biography. Exact search is disabled.'
                                    },
                                    value: 'text'
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    },
    uid (_data, step, attributes) {
        const options = attributes.filter(({ type })=>[
                'string',
                'text'
            ].includes(type)).map(({ name })=>({
                key: name,
                value: name,
                metadatas: {
                    intlLabel: {
                        id: `${name}.no-override`,
                        defaultMessage: name
                    }
                }
            }));
        return {
            sections: [
                {
                    sectionTitle: null,
                    items: [
                        {
                            ...nameField.nameField,
                            placeholder: {
                                id: getTrad.getTrad('modalForm.attribute.form.base.name.placeholder'),
                                defaultMessage: 'e.g. slug, seoUrl, canonicalUrl'
                            }
                        },
                        {
                            intlLabel: {
                                id: getTrad.getTrad('modalForm.attribute.target-field'),
                                defaultMessage: 'Attached field'
                            },
                            name: 'targetField',
                            type: 'select',
                            options: [
                                {
                                    key: '__null_reset_value__',
                                    value: '',
                                    metadatas: {
                                        intlLabel: {
                                            id: 'global.none',
                                            defaultMessage: 'None'
                                        }
                                    }
                                },
                                ...options
                            ]
                        }
                    ]
                }
            ]
        };
    }
};

exports.baseForm = baseForm;
//# sourceMappingURL=baseForm.js.map
