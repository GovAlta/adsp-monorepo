import { jsx } from 'react/jsx-runtime';
import { useField, createRulesEngine } from '@strapi/admin/strapi-admin';
import { Box, Flex } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useDocumentContext } from '../../../../../hooks/useDocumentContext.mjs';
import { ResponsiveGridRoot, ResponsiveGridItem } from '../../FormLayout.mjs';
import { useComponent, ComponentProvider } from '../ComponentContext.mjs';

const NonRepeatableComponent = ({ attribute, name, children, layout })=>{
    const { formatMessage } = useIntl();
    const { value } = useField(name);
    const level = useComponent('NonRepeatableComponent', (state)=>state.level);
    const isNested = level > 0;
    const { currentDocument } = useDocumentContext('NonRepeatableComponent');
    const rulesEngine = createRulesEngine();
    return /*#__PURE__*/ jsx(ComponentProvider, {
        id: value?.id,
        uid: attribute.component,
        level: level + 1,
        type: "component",
        children: /*#__PURE__*/ jsx(Box, {
            background: 'neutral100',
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 6,
            paddingBottom: 6,
            hasRadius: isNested,
            borderColor: isNested ? 'neutral200' : undefined,
            children: /*#__PURE__*/ jsx(Flex, {
                direction: "column",
                alignItems: "stretch",
                gap: 6,
                children: layout.map((row, index)=>{
                    const visibleFields = row.filter(({ ...field })=>{
                        const condition = field.attribute.conditions?.visible;
                        if (condition) {
                            return rulesEngine.evaluate(condition, value);
                        }
                        return true;
                    });
                    if (visibleFields.length === 0) {
                        return null; // Skip rendering the entire grid row
                    }
                    return /*#__PURE__*/ jsx(ResponsiveGridRoot, {
                        gap: 4,
                        children: visibleFields.map(({ size, ...field })=>{
                            /**
                   * Layouts are built from schemas so they don't understand the complete
                   * schema tree, for components we append the parent name to the field name
                   * because this is the structure for the data & permissions also understand
                   * the nesting involved.
                   */ const completeFieldName = `${name}.${field.name}`;
                            const translatedLabel = formatMessage({
                                id: `content-manager.components.${attribute.component}.${field.name}`,
                                defaultMessage: field.label
                            });
                            return /*#__PURE__*/ jsx(ResponsiveGridItem, {
                                col: size,
                                s: 12,
                                xs: 12,
                                direction: "column",
                                alignItems: "stretch",
                                children: children({
                                    ...field,
                                    label: translatedLabel,
                                    name: completeFieldName,
                                    document: currentDocument
                                })
                            }, completeFieldName);
                        })
                    }, index);
                })
            })
        })
    });
};

export { NonRepeatableComponent };
//# sourceMappingURL=NonRepeatable.mjs.map
