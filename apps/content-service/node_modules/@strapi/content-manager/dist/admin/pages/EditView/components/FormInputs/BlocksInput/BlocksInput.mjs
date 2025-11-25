import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useField } from '@strapi/admin/strapi-admin';
import { Field, Flex } from '@strapi/design-system';
import { BlocksEditor } from './BlocksEditor.mjs';

const BlocksInput = /*#__PURE__*/ React.forwardRef(({ label, name, required = false, hint, labelAction, ...editorProps }, forwardedRef)=>{
    const id = React.useId();
    const field = useField(name);
    return /*#__PURE__*/ jsx(Field.Root, {
        id: id,
        name: name,
        hint: hint,
        error: field.error,
        required: required,
        children: /*#__PURE__*/ jsxs(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 1,
            children: [
                /*#__PURE__*/ jsx(Field.Label, {
                    action: labelAction,
                    children: label
                }),
                /*#__PURE__*/ jsx(BlocksEditor, {
                    name: name,
                    error: field.error,
                    ref: forwardedRef,
                    value: field.value,
                    onChange: field.onChange,
                    ariaLabelId: id,
                    ...editorProps
                }),
                /*#__PURE__*/ jsx(Field.Hint, {}),
                /*#__PURE__*/ jsx(Field.Error, {})
            ]
        })
    });
});
const MemoizedBlocksInput = /*#__PURE__*/ React.memo(BlocksInput);

export { MemoizedBlocksInput as BlocksInput };
//# sourceMappingURL=BlocksInput.mjs.map
