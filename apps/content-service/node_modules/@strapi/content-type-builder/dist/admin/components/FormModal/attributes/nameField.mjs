import { getTrad } from '../../../utils/getTrad.mjs';

const nameField = {
    name: 'name',
    type: 'text',
    intlLabel: {
        id: 'global.name',
        defaultMessage: 'Name'
    },
    description: {
        id: getTrad('modalForm.attribute.form.base.name.description'),
        defaultMessage: 'No space is allowed for the name of the attribute'
    }
};

export { nameField };
//# sourceMappingURL=nameField.mjs.map
