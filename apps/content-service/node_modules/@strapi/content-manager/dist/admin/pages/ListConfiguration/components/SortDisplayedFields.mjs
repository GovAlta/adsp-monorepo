import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useForm } from '@strapi/admin/strapi-admin';
import { Flex, Typography, Box, Menu, VisuallyHidden } from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useDoc } from '../../../hooks/useDocument.mjs';
import { useGetContentTypeConfigurationQuery } from '../../../services/contentTypes.mjs';
import { checkIfAttributeIsDisplayable } from '../../../utils/attributes.mjs';
import { getTranslation } from '../../../utils/translations.mjs';
import { DraggableCard } from './DraggableCard.mjs';

const SortDisplayedFields = ()=>{
    const { formatMessage } = useIntl();
    const { model, schema } = useDoc();
    const [isDraggingSibling, setIsDraggingSibling] = React.useState(false);
    const [lastAction, setLastAction] = React.useState(null);
    const scrollableContainerRef = React.useRef(null);
    const values = useForm('SortDisplayedFields', (state)=>state.values.layout ?? []);
    const addFieldRow = useForm('SortDisplayedFields', (state)=>state.addFieldRow);
    const removeFieldRow = useForm('SortDisplayedFields', (state)=>state.removeFieldRow);
    const moveFieldRow = useForm('SortDisplayedFields', (state)=>state.moveFieldRow);
    const { metadata: allMetadata } = useGetContentTypeConfigurationQuery(model, {
        selectFromResult: ({ data })=>({
                metadata: data?.contentType.metadatas ?? {}
            })
    });
    /**
   * This is our list of fields that are not displayed in the current layout
   * so we create their default state to be added to the layout.
   */ const nonDisplayedFields = React.useMemo(()=>{
        if (!schema) {
            return [];
        }
        const displayedFieldNames = values.map((field)=>field.name);
        return Object.entries(schema.attributes).reduce((acc, [name, attribute])=>{
            if (!displayedFieldNames.includes(name) && checkIfAttributeIsDisplayable(attribute)) {
                const { list: metadata } = allMetadata[name];
                acc.push({
                    name,
                    label: metadata.label || name,
                    sortable: metadata.sortable
                });
            }
            return acc;
        }, []);
    }, [
        allMetadata,
        values,
        schema
    ]);
    const handleAddField = (field)=>{
        setLastAction('add');
        addFieldRow('layout', field);
    };
    const handleRemoveField = (index)=>{
        setLastAction('remove');
        removeFieldRow('layout', index);
    };
    const handleMoveField = (dragIndex, hoverIndex)=>{
        moveFieldRow('layout', dragIndex, hoverIndex);
    };
    React.useEffect(()=>{
        if (lastAction === 'add' && scrollableContainerRef?.current) {
            scrollableContainerRef.current.scrollLeft = scrollableContainerRef.current.scrollWidth;
        }
    }, [
        lastAction
    ]);
    return /*#__PURE__*/ jsxs(Flex, {
        alignItems: "stretch",
        direction: "column",
        gap: 4,
        children: [
            /*#__PURE__*/ jsx(Typography, {
                variant: "delta",
                tag: "h2",
                children: formatMessage({
                    id: getTranslation('containers.SettingPage.view'),
                    defaultMessage: 'View'
                })
            }),
            /*#__PURE__*/ jsxs(Flex, {
                padding: 4,
                borderColor: "neutral300",
                borderStyle: "dashed",
                borderWidth: "1px",
                hasRadius: true,
                children: [
                    /*#__PURE__*/ jsx(Box, {
                        flex: "1",
                        overflow: "auto hidden",
                        ref: scrollableContainerRef,
                        children: /*#__PURE__*/ jsx(Flex, {
                            gap: 3,
                            children: values.map((field, index)=>/*#__PURE__*/ jsx(DraggableCard, {
                                    index: index,
                                    isDraggingSibling: isDraggingSibling,
                                    onMoveField: handleMoveField,
                                    onRemoveField: ()=>handleRemoveField(index),
                                    setIsDraggingSibling: setIsDraggingSibling,
                                    ...field,
                                    attribute: schema.attributes[field.name],
                                    label: typeof field.label === 'object' ? formatMessage(field.label) : field.label
                                }, field.name))
                        })
                    }),
                    /*#__PURE__*/ jsxs(Menu.Root, {
                        children: [
                            /*#__PURE__*/ jsxs(Menu.Trigger, {
                                paddingLeft: 2,
                                paddingRight: 2,
                                justifyContent: "center",
                                endIcon: null,
                                disabled: nonDisplayedFields.length === 0,
                                variant: "tertiary",
                                children: [
                                    /*#__PURE__*/ jsx(VisuallyHidden, {
                                        tag: "span",
                                        children: formatMessage({
                                            id: getTranslation('components.FieldSelect.label'),
                                            defaultMessage: 'Add a field'
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Plus, {
                                        "aria-hidden": true,
                                        focusable: false,
                                        style: {
                                            position: 'relative',
                                            top: 2
                                        }
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsx(Menu.Content, {
                                children: nonDisplayedFields.map((field)=>/*#__PURE__*/ jsx(Menu.Item, {
                                        onSelect: ()=>handleAddField(field),
                                        children: typeof field.label === 'object' ? formatMessage(field.label) : field.label
                                    }, field.name))
                            })
                        ]
                    })
                ]
            })
        ]
    });
};

export { SortDisplayedFields };
//# sourceMappingURL=SortDisplayedFields.mjs.map
