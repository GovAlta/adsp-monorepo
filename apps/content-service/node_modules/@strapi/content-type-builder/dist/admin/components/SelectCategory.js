'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var useDataManager = require('./DataManager/useDataManager.js');

const SelectCategory = ({ error = null, intlLabel, name, onChange, value = undefined, isCreating, dynamicZoneTarget })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { allComponentsCategories } = useDataManager.useDataManager();
    const [categories, setCategories] = React.useState(allComponentsCategories);
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
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: errorMessage,
        name: name,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Combobox, {
                // TODO: re-enable category edits, renaming categories of already existing components currently breaks other functionality
                // See https://github.com/strapi/strapi/issues/20356
                disabled: !isCreating && !dynamicZoneTarget,
                onChange: handleChange,
                onCreateOption: handleCreateOption,
                value: value,
                creatable: true,
                children: categories.map((category)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.ComboboxOption, {
                        value: category,
                        children: category
                    }, category))
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
};

exports.SelectCategory = SelectCategory;
//# sourceMappingURL=SelectCategory.js.map
