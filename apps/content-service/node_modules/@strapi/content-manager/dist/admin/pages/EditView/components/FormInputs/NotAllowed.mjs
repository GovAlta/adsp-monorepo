import { jsxs, jsx } from 'react/jsx-runtime';
import { Field, TextInput } from '@strapi/design-system';
import { EyeStriked } from '@strapi/icons';
import { useIntl } from 'react-intl';

const NotAllowedInput = ({ hint, label, required, name })=>{
    const { formatMessage } = useIntl();
    const placeholder = formatMessage({
        id: 'components.NotAllowedInput.text',
        defaultMessage: 'No permissions to see this field'
    });
    return /*#__PURE__*/ jsxs(Field.Root, {
        id: name,
        hint: hint,
        name: name,
        required: required,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsx(TextInput, {
                disabled: true,
                placeholder: placeholder,
                startAction: /*#__PURE__*/ jsx(EyeStriked, {
                    fill: "neutral600"
                }),
                type: "text",
                value: ""
            }),
            /*#__PURE__*/ jsx(Field.Hint, {})
        ]
    });
};

export { NotAllowedInput };
//# sourceMappingURL=NotAllowed.mjs.map
