import { jsxs, jsx } from 'react/jsx-runtime';
import { Field, MultiSelectNested } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTrad } from '../utils/getTrad.mjs';
import { findAttribute } from '../utils/findAttribute.mjs';
import { useDataManager } from './DataManager/useDataManager.mjs';

const SelectComponents = ({ dynamicZoneTarget, intlLabel, name, onChange, value, targetUid })=>{
    const { formatMessage } = useIntl();
    const { componentsGroupedByCategory, contentTypes } = useDataManager();
    const dzSchema = findAttribute(contentTypes[targetUid].attributes, dynamicZoneTarget);
    if (!dzSchema) {
        return null;
    }
    const alreadyUsedComponents = 'components' in dzSchema ? dzSchema?.components : [];
    const filteredComponentsGroupedByCategory = Object.keys(componentsGroupedByCategory).reduce((acc, current)=>{
        const filteredComponents = componentsGroupedByCategory[current].filter(({ uid })=>{
            return !alreadyUsedComponents.includes(uid);
        });
        if (filteredComponents.length > 0) {
            acc[current] = filteredComponents;
        }
        return acc;
    }, {});
    const options = Object.entries(filteredComponentsGroupedByCategory).reduce((acc, current)=>{
        const [categoryName, components] = current;
        const section = {
            label: categoryName,
            children: components.map(({ uid, info: { displayName } })=>{
                return {
                    label: displayName,
                    value: uid
                };
            })
        };
        acc.push(section);
        return acc;
    }, []);
    const displayedValue = formatMessage({
        id: getTrad('components.SelectComponents.displayed-value'),
        defaultMessage: '{number, plural, =0 {# components} one {# component} other {# components}} selected'
    }, {
        number: value?.length ?? 0
    });
    return /*#__PURE__*/ jsxs(Field.Root, {
        name: name,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: formatMessage(intlLabel)
            }),
            /*#__PURE__*/ jsx(MultiSelectNested, {
                id: "select1",
                customizeContent: ()=>displayedValue,
                onChange: (values)=>{
                    onChange({
                        target: {
                            name,
                            value: values,
                            type: 'select-components'
                        }
                    });
                },
                options: options,
                value: value || []
            })
        ]
    });
};

export { SelectComponents };
//# sourceMappingURL=SelectComponents.mjs.map
