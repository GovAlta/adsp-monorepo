import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useField } from '@strapi/admin/strapi-admin';
import { Field, Flex, IconButton } from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useDocumentContext } from '../../../../../hooks/useDocumentContext.mjs';
import { getTranslation } from '../../../../../utils/translations.mjs';
import { transformDocument } from '../../../utils/data.mjs';
import { createDefaultForm } from '../../../utils/forms.mjs';
import { Initializer } from './Initializer.mjs';
import { NonRepeatableComponent } from './NonRepeatable.mjs';
import { RepeatableComponent } from './Repeatable.mjs';

const ComponentInput = ({ label, required, name, attribute, disabled, labelAction, ...props })=>{
    const { formatMessage } = useIntl();
    const field = useField(name);
    const showResetComponent = !attribute.repeatable && field.value && !disabled;
    const { currentDocument: { components } } = useDocumentContext('ComponentInput');
    const handleInitialisationClick = ()=>{
        const schema = components[attribute.component];
        const form = createDefaultForm(schema, components);
        const data = transformDocument(schema, components)(form);
        field.onChange(name, data);
    };
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: field.error,
        required: required,
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                justifyContent: "space-between",
                children: [
                    /*#__PURE__*/ jsxs(Field.Label, {
                        action: labelAction,
                        children: [
                            label,
                            attribute.repeatable && /*#__PURE__*/ jsxs(Fragment, {
                                children: [
                                    " (",
                                    Array.isArray(field.value) ? field.value.length : 0,
                                    ")"
                                ]
                            })
                        ]
                    }),
                    showResetComponent && /*#__PURE__*/ jsx(IconButton, {
                        label: formatMessage({
                            id: getTranslation('components.reset-entry'),
                            defaultMessage: 'Reset Entry'
                        }),
                        variant: "ghost",
                        onClick: ()=>{
                            field.onChange(name, null);
                        },
                        children: /*#__PURE__*/ jsx(Trash, {})
                    })
                ]
            }),
            !attribute.repeatable && !field.value && /*#__PURE__*/ jsx(Initializer, {
                disabled: disabled,
                name: name,
                onClick: handleInitialisationClick
            }),
            !attribute.repeatable && field.value ? /*#__PURE__*/ jsx(NonRepeatableComponent, {
                attribute: attribute,
                name: name,
                disabled: disabled,
                ...props,
                children: props.children
            }) : null,
            attribute.repeatable && /*#__PURE__*/ jsx(RepeatableComponent, {
                attribute: attribute,
                name: name,
                disabled: disabled,
                ...props,
                children: props.children
            }),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
};
const MemoizedComponentInput = /*#__PURE__*/ React.memo(ComponentInput);

export { MemoizedComponentInput as ComponentInput };
//# sourceMappingURL=Input.mjs.map
