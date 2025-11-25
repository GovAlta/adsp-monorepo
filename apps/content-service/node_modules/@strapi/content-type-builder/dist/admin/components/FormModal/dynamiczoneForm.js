'use strict';

var getTrad = require('../../utils/getTrad.js');
var componentField = require('./component/componentField.js');
var componentForm = require('./component/componentForm.js');

const dynamiczoneForm = {
    advanced: {
        default () {
            return {
                sections: componentForm.componentForm.advanced()
            };
        }
    },
    base: {
        createComponent () {
            return {
                sections: [
                    {
                        sectionTitle: null,
                        items: [
                            componentField.componentField
                        ]
                    },
                    ...componentForm.componentForm.base('componentToCreate.')
                ]
            };
        },
        default () {
            return {
                sections: [
                    {
                        sectionTitle: null,
                        items: [
                            componentField.componentField
                        ]
                    },
                    {
                        sectionTitle: null,
                        items: [
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
                                name: 'components',
                                type: 'select-components',
                                intlLabel: {
                                    id: getTrad.getTrad('modalForm.attributes.select-components'),
                                    defaultMessage: 'Select the components'
                                },
                                isMultiple: true
                            }
                        ]
                    }
                ]
            };
        }
    }
};

exports.dynamiczoneForm = dynamiczoneForm;
//# sourceMappingURL=dynamiczoneForm.js.map
