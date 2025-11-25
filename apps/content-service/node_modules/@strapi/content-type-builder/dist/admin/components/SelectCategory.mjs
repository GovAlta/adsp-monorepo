import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { Field, Combobox, ComboboxOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useDataManager } from './DataManager/useDataManager.mjs';

const SelectCategory = ({ error = null, intlLabel, name, onChange, value = undefined, isCreating, dynamicZoneTarget })=>{
    const { formatMessage } = useIntl();
    const { allComponentsCategories } = useDataManager();
    const [categories, setCategories] = useState(allComponentsCategories);
    const errorMessage = error ? formatMessage({
        id: error,
        defaultMessage: error
    }) : '';
    const label = formatMessage(intlLabel);
    const handleChange = (value)=>{
        onChange({
            target: {
                name,
                value,
                type: 'select-category'
            }
        });
    };
    const handleCreateOption = (value)=>{
        setCategories((prev)=>[
                ...prev,
                value
            ]);
        handleChange(value);
    };
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: errorMessage,
        name: name,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsx(Combobox, {
                // TODO: re-enable category edits, renaming categories of already existing components currently breaks other functionality
                // See https://github.com/strapi/strapi/issues/20356
                disabled: !isCreating && !dynamicZoneTarget,
                onChange: handleChange,
                onCreateOption: handleCreateOption,
                value: value,
                creatable: true,
                children: categories.map((category)=>/*#__PURE__*/ jsx(ComboboxOption, {
                        value: category,
                        children: category
                    }, category))
            }),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
};

export { SelectCategory };
//# sourceMappingURL=SelectCategory.mjs.map
