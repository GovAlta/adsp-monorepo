import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Layouts, Form, useForm, createRulesEngine } from '@strapi/admin/strapi-admin';
import { Box, Flex, Divider, Typography, Grid } from '@strapi/design-system';
import pipe from 'lodash/fp/pipe';
import { useIntl } from 'react-intl';
import { useDoc } from '../../hooks/useDocument.mjs';
import { useTypedSelector } from '../../modules/hooks.mjs';
import { removeFieldsThatDontExistOnSchema, prepareTempKeys } from '../../pages/EditView/utils/data.mjs';
import { useHistoryContext } from '../pages/History.mjs';
import { VersionInputRenderer } from './VersionInputRenderer.mjs';

const createLayoutFromFields = (fields)=>{
    return fields.reduce((rows, field)=>{
        if (field.type === 'dynamiczone') {
            // Dynamic zones take up all the columns in a row
            rows.push([
                field
            ]);
            return rows;
        }
        if (!rows[rows.length - 1]) {
            // Create a new row if there isn't one available
            rows.push([]);
        }
        // Push fields to the current row, they wrap and handle their own column size
        rows[rows.length - 1].push(field);
        return rows;
    }, [])// Map the rows to panels
    .map((row)=>[
            row
        ]);
};
/**
 * Build a layout for the fields that are were deleted from the edit view layout
 * via the configure the view page. This layout will be merged with the main one.
 * Those fields would be restored if the user restores the history version, which is why it's
 * important to show them, even if they're not in the normal layout.
 */ function getRemaingFieldsLayout({ layout, metadatas, schemaAttributes, fieldSizes }) {
    const fieldsInLayout = layout.flatMap((panel)=>panel.flatMap((row)=>row.flatMap((field)=>field.name)));
    const remainingFields = Object.entries(metadatas).reduce((currentRemainingFields, [name, field])=>{
        // Make sure we do not fields that are not visible, e.g. "id"
        if (!fieldsInLayout.includes(name) && field.edit.visible === true) {
            const attribute = schemaAttributes[name];
            // @ts-expect-error not sure why attribute causes type error
            currentRemainingFields.push({
                attribute,
                type: attribute.type,
                visible: true,
                disabled: true,
                label: field.edit.label || name,
                name: name,
                size: fieldSizes[attribute.type].default ?? 12
            });
        }
        return currentRemainingFields;
    }, []);
    return createLayoutFromFields(remainingFields);
}
/* -------------------------------------------------------------------------------------------------
 * FormPanel
 * -----------------------------------------------------------------------------------------------*/ const FormPanel = ({ panel })=>{
    const fieldValues = useForm('Fields', (state)=>state.values);
    const rulesEngine = createRulesEngine();
    if (panel.some((row)=>row.some((field)=>field.type === 'dynamiczone'))) {
        const [row] = panel;
        const [field] = row;
        const condition = field.attribute?.conditions?.visible;
        if (condition) {
            const isVisible = rulesEngine.evaluate(condition, fieldValues);
            if (!isVisible) {
                return null; // Skip rendering the dynamic zone if the condition is not met
            }
        }
        return /*#__PURE__*/ jsx(Grid.Root, {
            gap: 4,
            children: /*#__PURE__*/ jsx(Grid.Item, {
                col: 12,
                s: 12,
                xs: 12,
                direction: "column",
                alignItems: "stretch",
                children: /*#__PURE__*/ jsx(VersionInputRenderer, {
                    ...field
                })
            })
        }, field.name);
    }
    return /*#__PURE__*/ jsx(Box, {
        hasRadius: true,
        background: "neutral0",
        shadow: "tableShadow",
        paddingLeft: 6,
        paddingRight: 6,
        paddingTop: 6,
        paddingBottom: 6,
        borderColor: "neutral150",
        children: /*#__PURE__*/ jsx(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 6,
            children: panel.map((row, gridRowIndex)=>{
                const visibleFields = row.filter((field)=>{
                    const condition = field.attribute?.conditions?.visible;
                    if (condition) {
                        return rulesEngine.evaluate(condition, fieldValues);
                    }
                    return true;
                });
                if (visibleFields.length === 0) {
                    return null; // Skip rendering the entire grid row
                }
                return /*#__PURE__*/ jsx(Grid.Root, {
                    gap: 4,
                    children: visibleFields.map(({ size, ...field })=>{
                        return /*#__PURE__*/ jsx(Grid.Item, {
                            col: size,
                            s: 12,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(VersionInputRenderer, {
                                ...field
                            })
                        }, field.name);
                    })
                }, gridRowIndex);
            })
        })
    });
};
const VersionContent = ()=>{
    const { formatMessage } = useIntl();
    const { fieldSizes } = useTypedSelector((state)=>state['content-manager'].app);
    const version = useHistoryContext('VersionContent', (state)=>state.selectedVersion);
    const layout = useHistoryContext('VersionContent', (state)=>state.layout);
    const configuration = useHistoryContext('VersionContent', (state)=>state.configuration);
    const schema = useHistoryContext('VersionContent', (state)=>state.schema);
    // Build a layout for the unknown fields section
    const removedAttributes = version.meta.unknownAttributes.removed;
    const removedAttributesAsFields = Object.entries(removedAttributes).map(([attributeName, attribute])=>{
        const field = {
            attribute,
            shouldIgnoreRBAC: true,
            type: attribute.type,
            visible: true,
            disabled: true,
            label: attributeName,
            name: attributeName,
            size: fieldSizes[attribute.type].default ?? 12
        };
        return field;
    });
    const unknownFieldsLayout = createLayoutFromFields(removedAttributesAsFields);
    // Build a layout for the fields that are were deleted from the layout
    const remainingFieldsLayout = getRemaingFieldsLayout({
        metadatas: configuration.contentType.metadatas,
        layout,
        schemaAttributes: schema.attributes,
        fieldSizes
    });
    const { components } = useDoc();
    /**
   * Transform the data before passing it to the form so that each field
   * has a uniquely generated key
   */ const transformedData = React.useMemo(()=>{
        const transform = (schemaAttributes, components = {})=>(document)=>{
                const schema = {
                    attributes: schemaAttributes
                };
                const transformations = pipe(removeFieldsThatDontExistOnSchema(schema), prepareTempKeys(schema, components));
                return transformations(document);
            };
        return transform(version.schema, components)(version.data);
    }, [
        components,
        version.data,
        version.schema
    ]);
    return /*#__PURE__*/ jsxs(Layouts.Content, {
        children: [
            /*#__PURE__*/ jsx(Box, {
                paddingBottom: 8,
                children: /*#__PURE__*/ jsx(Form, {
                    disabled: true,
                    method: "PUT",
                    initialValues: transformedData,
                    children: /*#__PURE__*/ jsx(Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 6,
                        position: "relative",
                        children: [
                            ...layout,
                            ...remainingFieldsLayout
                        ].map((panel, index)=>{
                            return /*#__PURE__*/ jsx(FormPanel, {
                                panel: panel
                            }, index);
                        })
                    })
                })
            }),
            removedAttributesAsFields.length > 0 && /*#__PURE__*/ jsxs(Fragment, {
                children: [
                    /*#__PURE__*/ jsx(Divider, {}),
                    /*#__PURE__*/ jsxs(Box, {
                        paddingTop: 8,
                        children: [
                            /*#__PURE__*/ jsxs(Flex, {
                                direction: "column",
                                alignItems: "flex-start",
                                paddingBottom: 6,
                                gap: 1,
                                children: [
                                    /*#__PURE__*/ jsx(Typography, {
                                        variant: "delta",
                                        children: formatMessage({
                                            id: 'content-manager.history.content.unknown-fields.title',
                                            defaultMessage: 'Unknown fields'
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Typography, {
                                        variant: "pi",
                                        children: formatMessage({
                                            id: 'content-manager.history.content.unknown-fields.message',
                                            defaultMessage: 'These fields have been deleted or renamed in the Content-Type Builder. <b>These fields will not be restored.</b>'
                                        }, {
                                            b: (chunks)=>/*#__PURE__*/ jsx(Typography, {
                                                    variant: "pi",
                                                    fontWeight: "bold",
                                                    children: chunks
                                                })
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsx(Form, {
                                disabled: true,
                                method: "PUT",
                                initialValues: version.data,
                                children: /*#__PURE__*/ jsx(Flex, {
                                    direction: "column",
                                    alignItems: "stretch",
                                    gap: 6,
                                    position: "relative",
                                    children: unknownFieldsLayout.map((panel, index)=>{
                                        return /*#__PURE__*/ jsx(FormPanel, {
                                            panel: panel
                                        }, index);
                                    })
                                })
                            })
                        ]
                    })
                ]
            })
        ]
    });
};

export { VersionContent, getRemaingFieldsLayout };
//# sourceMappingURL=VersionContent.mjs.map
