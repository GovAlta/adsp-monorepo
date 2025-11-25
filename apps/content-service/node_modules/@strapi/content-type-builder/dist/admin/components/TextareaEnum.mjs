import { jsxs, jsx } from 'react/jsx-runtime';
import { Field, Textarea } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const TextareaEnum = ({ description = null, disabled = false, error = '', intlLabel, labelAction, name, onChange, placeholder = null, value = '' })=>{
    const { formatMessage } = useIntl();
    const errorMessage = error ? formatMessage({
        id: error,
        defaultMessage: error
    }) : '';
    const hint = description ? formatMessage({
        id: description.id,
        defaultMessage: description.defaultMessage
    }, {
        ...description.values
    }) : '';
    const label = formatMessage(intlLabel);
    const formattedPlaceholder = placeholder ? formatMessage({
        id: placeholder.id,
        defaultMessage: placeholder.defaultMessage
    }, {
        ...placeholder.values
    }) : '';
    const inputValue = Array.isArray(value) ? value.join('\n') : '';
    const handleChange = (e)=>{
        const arrayValue = e.target.value.split('\n');
        onChange({
            target: {
                name,
                value: arrayValue
            }
        });
    };
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: errorMessage,
        hint: hint,
        name: name,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                action: labelAction,
                children: label
            }),
            /*#__PURE__*/ jsx(Textarea, {
                disabled: disabled,
                onChange: handleChange,
                placeholder: formattedPlaceholder,
                value: inputValue
            }),
            /*#__PURE__*/ jsx(Field.Error, {}),
            /*#__PURE__*/ jsx(Field.Hint, {})
        ]
    });
};

export { TextareaEnum };
//# sourceMappingURL=TextareaEnum.mjs.map
