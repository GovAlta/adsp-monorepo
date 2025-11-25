'use strict';

var getTrad = require('../../../utils/getTrad.js');

const componentForm = {
    base (prefix = '') {
        const sections = [
            {
                sectionTitle: null,
                items: [
                    {
                        name: `${prefix}displayName`,
                        type: 'text',
                        intlLabel: {
                            id: getTrad.getTrad('contentType.displayName.label'),
                            defaultMessage: 'Display Name'
                        }
                    },
                    {
                        name: `${prefix}category`,
                        type: 'select-category',
                        intlLabel: {
                            id: getTrad.getTrad('modalForm.components.create-component.category.label'),
                            defaultMessage: 'Select a category or enter a name to create a new one'
                        }
                    }
                ]
            },
            {
                sectionTitle: null,
                items: [
                    {
                        name: `${prefix}icon`,
                        type: 'icon-picker',
                        size: 12,
                        intlLabel: {
                            id: getTrad.getTrad('modalForm.components.icon.label'),
                            defaultMessage: 'Icon'
                        }
                    }
                ]
            }
        ];
        return sections;
    },
    advanced () {
        const sections = [];
        return sections;
    }
};

exports.componentForm = componentForm;
//# sourceMappingURL=componentForm.js.map
