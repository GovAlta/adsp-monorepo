import { jsxs, jsx } from 'react/jsx-runtime';
import { memo, forwardRef } from 'react';
import { useComposedRefs, Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useFocusInputField } from '../../hooks/useFocusInputField.mjs';
import { useField } from '../Form.mjs';

const EnumerationInput = /*#__PURE__*/ forwardRef(({ name, required, label, hint, labelAction, options = [], ...props }, ref)=>{
    const { formatMessage } = useIntl();
    const field = useField(name);
    const fieldRef = useFocusInputField(name);
    const composedRefs = useComposedRefs(ref, fieldRef);
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: field.error,
        name: name,
        hint: hint,
        required: required,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                action: labelAction,
                children: label
            }),
            /*#__PURE__*/ jsxs(SingleSelect, {
                ref: composedRefs,
                onChange: (value)=>{
                    field.onChange(name, value);
                },
                value: field.value,
                ...props,
                children: [
                    /*#__PURE__*/ jsx(SingleSelectOption, {
                        value: "",
                        disabled: required,
                        hidden: required,
                        children: formatMessage({
                            id: 'components.InputSelect.option.placeholder',
                            defaultMessage: 'Choose here'
                        })
                    }),
                    options.map(({ value, label, disabled, hidden })=>{
                        return /*#__PURE__*/ jsx(SingleSelectOption, {
                            value: value,
                            disabled: disabled,
                            hidden: hidden,
                            children: label ?? value
                        }, value);
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
});
const MemoizedEnumerationInput = /*#__PURE__*/ memo(EnumerationInput);

export { MemoizedEnumerationInput as EnumerationInput };
//# sourceMappingURL=Enumeration.mjs.map
