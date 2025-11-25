'use strict';

var getTrad = require('../../../utils/getTrad.js');

const nameField = {
    name: 'displayName',
    type: 'text',
    intlLabel: {
        id: getTrad.getTrad('contentType.displayName.label'),
        defaultMessage: 'Display name'
    }
};
const contentTypeForm = {
    advanced: {
        default () {
            return {
                sections: [
                    {
                        items: [
                            {
                                intlLabel: {
                                    id: getTrad.getTrad('contentType.draftAndPublish.label'),
                                    defaultMessage: 'Draft & publish'
                                },
                                description: {
                                    id: getTrad.getTrad('contentType.draftAndPublish.description'),
                                    defaultMessage: 'Allows writing a draft version of an entry, before it is published'
                                },
                                name: 'draftAndPublish',
                                type: 'toggle-draft-publish',
                                validations: {}
                            }
                        ]
                    }
                ]
            };
        }
    },
    base: {
        create () {
            return {
                sections: [
                    {
                        sectionTitle: null,
                        items: [
                            nameField,
                            {
                                description: {
                                    id: getTrad.getTrad('contentType.apiId-singular.description'),
                                    defaultMessage: 'Used to generate the API routes and databases tables/collections'
                                },
                                intlLabel: {
                                    id: getTrad.getTrad('contentType.apiId-singular.label'),
                                    defaultMessage: 'API ID (Singular)'
                                },
                                name: 'singularName',
                                type: 'text-singular'
                            },
                            {
                                type: 'pushRight',
                                size: 6,
                                intlLabel: {
                                    id: '',
                                    defaultMessage: ''
                                },
                                name: 'pushRight'
                            },
                            {
                                description: {
                                    id: getTrad.getTrad('contentType.apiId-plural.description'),
                                    defaultMessage: 'Pluralized API ID'
                                },
                                intlLabel: {
                                    id: getTrad.getTrad('contentType.apiId-plural.label'),
                                    defaultMessage: 'API ID (Plural)'
                                },
                                name: 'pluralName',
                                type: 'text-plural'
                            }
                        ]
                    }
                ]
            };
        },
        edit () {
            return {
                sections: [
                    {
                        sectionTitle: null,
                        items: [
                            nameField,
                            {
                                disabled: true,
                                description: {
                                    id: getTrad.getTrad('contentType.apiId-singular.description'),
                                    defaultMessage: 'Used to generate the API routes and databases tables/collections'
                                },
                                intlLabel: {
                                    id: getTrad.getTrad('contentType.apiId-singular.label'),
                                    defaultMessage: 'API ID (Singular)'
                                },
                                name: 'singularName',
                                type: 'text'
                            },
                            {
                                type: 'pushRight',
                                size: 6,
                                intlLabel: {
                                    id: '',
                                    defaultMessage: ''
                                },
                                name: 'pushRight'
                            },
                            {
                                disabled: true,
                                description: {
                                    id: getTrad.getTrad('contentType.apiId-plural.description'),
                                    defaultMessage: 'Pluralized API ID'
                                },
                                intlLabel: {
                                    id: getTrad.getTrad('contentType.apiId-plural.label'),
                                    defaultMessage: 'API ID (Plural)'
                                },
                                name: 'pluralName',
                                type: 'text'
                            },
                            {
                                intlLabel: {
                                    id: 'global.type',
                                    defaultMessage: 'Type'
                                },
                                name: 'kind',
                                type: 'content-type-radio-group',
                                size: 12,
                                radios: [
                                    {
                                        title: {
                                            id: getTrad.getTrad('form.button.collection-type.name'),
                                            defaultMessage: 'Collection Type'
                                        },
                                        description: {
                                            id: getTrad.getTrad('form.button.collection-type.description'),
                                            defaultMessage: 'Best for multiple instances like articles, products, comments, etc.'
                                        },
                                        value: 'collectionType'
                                    },
                                    {
                                        title: {
                                            id: getTrad.getTrad('form.button.single-type.name'),
                                            defaultMessage: 'Single Type'
                                        },
                                        description: {
                                            id: getTrad.getTrad('form.button.single-type.description'),
                                            defaultMessage: 'Best for single instance like about us, homepage, etc.'
                                        },
                                        value: 'singleType'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
        }
    }
};

exports.contentTypeForm = contentTypeForm;
//# sourceMappingURL=contentTypeForm.js.map
