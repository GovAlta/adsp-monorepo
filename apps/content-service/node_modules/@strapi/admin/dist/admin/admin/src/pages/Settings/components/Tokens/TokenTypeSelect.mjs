import { jsxs, jsx } from 'react/jsx-runtime';
import { Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { isErrorMessageMessageDescriptor } from '../../utils/forms.mjs';

const TokenTypeSelect = ({ name = 'type', error, value, onChange, canEditInputs, options = [], label })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: error ? formatMessage(isErrorMessageMessageDescriptor(error) ? error : {
            id: error,
            defaultMessage: error
        }) : undefined,
        name: name,
        required: true,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: formatMessage({
                    id: label.id,
                    defaultMessage: label.defaultMessage
                })
            }),
            /*#__PURE__*/ jsx(SingleSelect, {
                value: value,
                onChange: onChange,
                placeholder: "Select",
                disabled: !canEditInputs,
                children: options && options.map(({ value, label })=>/*#__PURE__*/ jsx(SingleSelectOption, {
                        value: value,
                        children: formatMessage(label)
                    }, value))
            }),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
};

export { TokenTypeSelect };
//# sourceMappingURL=TokenTypeSelect.mjs.map
