'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var useDocumentContext = require('../../../../../hooks/useDocumentContext.js');
var FormLayout = require('../../FormLayout.js');
var ComponentContext = require('../ComponentContext.js');

const NonRepeatableComponent = ({ attribute, name, children, layout })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { value } = strapiAdmin.useField(name);
    const level = ComponentContext.useComponent('NonRepeatableComponent', (state)=>state.level);
    const isNested = level > 0;
    const { currentDocument } = useDocumentContext.useDocumentContext('NonRepeatableComponent');
    const rulesEngine = strapiAdmin.createRulesEngine();
    return /*#__PURE__*/ jsxRuntime.jsx(ComponentContext.ComponentProvider, {
        id: value?.id,
        uid: attribute.component,
        level: level + 1,
        type: "component",
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
            background: 'neutral100',
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 6,
            paddingBottom: 6,
            hasRadius: isNested,
            borderColor: isNested ? 'neutral200' : undefined,
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
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
                    return /*#__PURE__*/ jsxRuntime.jsx(FormLayout.ResponsiveGridRoot, {
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
                            return /*#__PURE__*/ jsxRuntime.jsx(FormLayout.ResponsiveGridItem, {
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

exports.NonRepeatableComponent = NonRepeatableComponent;
//# sourceMappingURL=NonRepeatable.js.map
