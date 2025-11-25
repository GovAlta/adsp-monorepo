'use strict';

var getTrad = require('../../../utils/getTrad.js');

const nameField = {
    name: 'name',
    type: 'text',
    intlLabel: {
        id: 'global.name',
        defaultMessage: 'Name'
    },
    description: {
        id: getTrad.getTrad('modalForm.attribute.form.base.name.description'),
        defaultMessage: 'No space is allowed for the name of the attribute'
    }
};

exports.nameField = nameField;
//# sourceMappingURL=nameField.js.map
