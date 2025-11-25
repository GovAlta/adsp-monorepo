'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var constants = require('../constants.js');
var getMaxDepth = require('../utils/getMaxDepth.js');
var useDataManager = require('./DataManager/useDataManager.js');

const SelectComponent = ({ error = null, intlLabel, isAddingAComponentToAnotherComponent, isCreating, isCreatingComponentWhileAddingAField, componentToCreate, name, onChange, targetUid, forTarget, value })=>{
    const { formatMessage } = reactIntl.useIntl();
    const errorMessage = error ? formatMessage({
        id: error,
        defaultMessage: error
    }) : '';
    const label = formatMessage(intlLabel);
    const { componentsGroupedByCategory, componentsThatHaveOtherComponentInTheirAttributes, nestedComponents } = useDataManager.useDataManager();
    const isTargetAComponent = forTarget === 'component';
    let options = Object.entries(componentsGroupedByCategory).reduce((acc, current)=>{
        const [categoryName, components] = current;
        const compos = components.map((component)=>{
            return {
                uid: component.uid,
                label: component.info.displayName,
                categoryName
            };
        });
        return [
            ...acc,
            ...compos
        ];
    }, []);
    if (isAddingAComponentToAnotherComponent) {
        options = options.filter(({ uid })=>{
            const maxDepth = getMaxDepth.getChildrenMaxDepth(uid, componentsThatHaveOtherComponentInTheirAttributes);
            const componentDepth = getMaxDepth.getComponentDepth(targetUid, nestedComponents);
            const totalDepth = maxDepth + componentDepth;
            return totalDepth <= constants.MAX_COMPONENT_DEPTH;
        });
    }
    if (isTargetAComponent) {
        options = options.filter((option)=>{
            return option.uid !== targetUid;
        });
    }
    if (isCreatingComponentWhileAddingAField) {
        options = [
            {
                uid: value,
                label: componentToCreate?.displayName,
                categoryName: componentToCreate?.category
            }
        ];
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: errorMessage,
        name: name,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                disabled: isCreatingComponentWhileAddingAField || !isCreating,
                onChange: (value)=>{
                    onChange({
                        target: {
                            name,
                            value,
                            type: 'select-category'
                        }
                    });
                },
                value: value || '',
                children: options.map((option)=>{
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                        value: option.uid,
                        children: `${option.categoryName} - ${option.label}`
                    }, option.uid);
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
};

exports.SelectComponent = SelectComponent;
//# sourceMappingURL=SelectComponent.js.map
