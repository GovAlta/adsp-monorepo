import { jsxs, jsx } from 'react/jsx-runtime';
import { Field, TextInput } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { isErrorMessageMessageDescriptor } from '../../utils/forms.mjs';

const TokenName = ({ error, value, onChange, canEditInputs })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Field.Root, {
        name: "name",
        error: error ? formatMessage(isErrorMessageMessageDescriptor(error) ? error : {
            id: error,
            defaultMessage: error
        }) : undefined,
        required: true,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: formatMessage({
                    id: 'Settings.tokens.form.name',
                    defaultMessage: 'Name'
                })
            }),
            /*#__PURE__*/ jsx(TextInput, {
                onChange: onChange,
                value: value,
                disabled: !canEditInputs
            }),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
};

export { TokenName };
//# sourceMappingURL=TokenName.mjs.map
