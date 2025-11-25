import { jsxs, jsx } from 'react/jsx-runtime';
import { memo, forwardRef } from 'react';
import { useComposedRefs, Field, Toggle } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useFocusInputField } from '../../hooks/useFocusInputField.mjs';
import { useField } from '../Form.mjs';

const BooleanInput = /*#__PURE__*/ forwardRef(({ name, required, label, hint, labelAction, ...props }, ref)=>{
    const { formatMessage } = useIntl();
    const field = useField(name);
    const fieldRef = useFocusInputField(name);
    const composedRefs = useComposedRefs(ref, fieldRef);
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: field.error,
        name: name,
        hint: hint,
        required: required,
        maxWidth: "320px",
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                action: labelAction,
                children: label
            }),
            /*#__PURE__*/ jsx(Toggle, {
                ref: composedRefs,
                checked: field.value === null ? null : field.value || false,
                offLabel: formatMessage({
                    id: 'app.components.ToggleCheckbox.off-label',
                    defaultMessage: 'False'
                }),
                onLabel: formatMessage({
                    id: 'app.components.ToggleCheckbox.on-label',
                    defaultMessage: 'True'
                }),
                onChange: field.onChange,
                ...props
            }),
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
});
const MemoizedBooleanInput = /*#__PURE__*/ memo(BooleanInput);

export { MemoizedBooleanInput as BooleanInput };
//# sourceMappingURL=Boolean.mjs.map
