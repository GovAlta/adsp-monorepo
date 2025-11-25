import { jsxs, jsx } from 'react/jsx-runtime';
import { Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { MAX_COMPONENT_DEPTH } from '../constants.mjs';
import { getChildrenMaxDepth, getComponentDepth } from '../utils/getMaxDepth.mjs';
import { useDataManager } from './DataManager/useDataManager.mjs';

const SelectComponent = ({ error = null, intlLabel, isAddingAComponentToAnotherComponent, isCreating, isCreatingComponentWhileAddingAField, componentToCreate, name, onChange, targetUid, forTarget, value })=>{
    const { formatMessage } = useIntl();
    const errorMessage = error ? formatMessage({
        id: error,
        defaultMessage: error
    }) : '';
    const label = formatMessage(intlLabel);
    const { componentsGroupedByCategory, componentsThatHaveOtherComponentInTheirAttributes, nestedComponents } = useDataManager();
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
            const maxDepth = getChildrenMaxDepth(uid, componentsThatHaveOtherComponentInTheirAttributes);
            const componentDepth = getComponentDepth(targetUid, nestedComponents);
            const totalDepth = maxDepth + componentDepth;
            return totalDepth <= MAX_COMPONENT_DEPTH;
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
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: errorMessage,
        name: name,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsx(SingleSelect, {
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
                    return /*#__PURE__*/ jsx(SingleSelectOption, {
                        value: option.uid,
                        children: `${option.categoryName} - ${option.label}`
                    }, option.uid);
                })
            }),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
};

export { SelectComponent };
//# sourceMappingURL=SelectComponent.mjs.map
