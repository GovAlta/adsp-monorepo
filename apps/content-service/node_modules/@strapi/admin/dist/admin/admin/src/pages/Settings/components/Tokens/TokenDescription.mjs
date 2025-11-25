import { jsxs, jsx } from 'react/jsx-runtime';
import { Field, Textarea } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { isErrorMessageMessageDescriptor } from '../../utils/forms.mjs';

const TokenDescription = ({ error, value, onChange, canEditInputs })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Field.Root, {
        name: "description",
        error: error ? formatMessage(isErrorMessageMessageDescriptor(error) ? error : {
            id: error,
            defaultMessage: error
        }) : undefined,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: formatMessage({
                    id: 'Settings.tokens.form.description',
                    defaultMessage: 'Description'
                })
            }),
            /*#__PURE__*/ jsx(Textarea, {
                onChange: onChange,
                disabled: !canEditInputs,
                value: value
            }),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
};

export { TokenDescription };
//# sourceMappingURL=TokenDescription.mjs.map
