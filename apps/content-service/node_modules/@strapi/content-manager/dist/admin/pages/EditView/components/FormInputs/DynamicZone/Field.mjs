import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { createContext, useForm, useField, useNotification } from '@strapi/admin/strapi-admin';
import { Flex, Box, VisuallyHidden } from '@strapi/design-system';
import pipe from 'lodash/fp/pipe';
import { useIntl } from 'react-intl';
import { useDocumentContext } from '../../../../../hooks/useDocumentContext.mjs';
import { getTranslation } from '../../../../../utils/translations.mjs';
import { transformDocument } from '../../../utils/data.mjs';
import { createDefaultForm } from '../../../utils/forms.mjs';
import { useComponent, ComponentProvider } from '../ComponentContext.mjs';
import { AddComponentButton } from './AddComponentButton.mjs';
import { ComponentPicker } from './ComponentPicker.mjs';
import { DynamicComponent } from './DynamicComponent.mjs';
import { DynamicZoneLabel } from './DynamicZoneLabel.mjs';

const [DynamicZoneProvider, useDynamicZone] = createContext('DynamicZone', {
    isInDynamicZone: false
});
const DynamicZone = ({ attribute, disabled: disabledProp, hint, label, labelAction, name, required = false, children })=>{
    // We cannot use the default props here
    const { max = Infinity, min = -Infinity } = attribute ?? {};
    const [addComponentIsOpen, setAddComponentIsOpen] = React.useState(false);
    const [liveText, setLiveText] = React.useState('');
    const { currentDocument: { components, isLoading } } = useDocumentContext('DynamicZone');
    const disabled = disabledProp || isLoading;
    const { addFieldRow, removeFieldRow, moveFieldRow } = useForm('DynamicZone', ({ addFieldRow, removeFieldRow, moveFieldRow })=>({
            addFieldRow,
            removeFieldRow,
            moveFieldRow
        }));
    const { value = [], error } = useField(name);
    const dynamicComponentsByCategory = React.useMemo(()=>{
        return attribute.components.reduce((acc, componentUid)=>{
            const { category, info } = components[componentUid] ?? {
                info: {}
            };
            const component = {
                uid: componentUid,
                displayName: info.displayName,
                icon: info.icon
            };
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category] = [
                ...acc[category],
                component
            ];
            return acc;
        }, {});
    }, [
        attribute.components,
        components
    ]);
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const dynamicDisplayedComponentsLength = value.length;
    const handleAddComponent = (uid, position)=>{
        setAddComponentIsOpen(false);
        const schema = components[uid];
        const form = createDefaultForm(schema, components);
        const transformations = pipe(transformDocument(schema, components), (data)=>({
                ...data,
                __component: uid
            }));
        const data = transformations(form);
        addFieldRow(name, data, position);
    };
    const handleClickOpenPicker = ()=>{
        if (dynamicDisplayedComponentsLength < max) {
            setAddComponentIsOpen((prev)=>!prev);
        } else {
            toggleNotification({
                type: 'info',
                message: formatMessage({
                    id: getTranslation('components.notification.info.maximum-requirement')
                })
            });
        }
    };
    const handleMoveComponent = (newIndex, currentIndex)=>{
        setLiveText(formatMessage({
            id: getTranslation('dnd.reorder'),
            defaultMessage: '{item}, moved. New position in list: {position}.'
        }, {
            item: `${name}.${currentIndex}`,
            position: getItemPos(newIndex)
        }));
        moveFieldRow(name, currentIndex, newIndex);
    };
    const getItemPos = (index)=>`${index + 1} of ${value.length}`;
    const handleCancel = (index)=>{
        setLiveText(formatMessage({
            id: getTranslation('dnd.cancel-item'),
            defaultMessage: '{item}, dropped. Re-order cancelled.'
        }, {
            item: `${name}.${index}`
        }));
    };
    const handleGrabItem = (index)=>{
        setLiveText(formatMessage({
            id: getTranslation('dnd.grab-item'),
            defaultMessage: `{item}, grabbed. Current position in list: {position}. Press up and down arrow to change position, Spacebar to drop, Escape to cancel.`
        }, {
            item: `${name}.${index}`,
            position: getItemPos(index)
        }));
    };
    const handleDropItem = (index)=>{
        setLiveText(formatMessage({
            id: getTranslation('dnd.drop-item'),
            defaultMessage: `{item}, dropped. Final position in list: {position}.`
        }, {
            item: `${name}.${index}`,
            position: getItemPos(index)
        }));
    };
    const handleRemoveComponent = (name, currentIndex)=>()=>{
            removeFieldRow(name, currentIndex);
        };
    const hasError = error !== undefined;
    const renderButtonLabel = ()=>{
        if (addComponentIsOpen) {
            return formatMessage({
                id: 'app.utils.close-label',
                defaultMessage: 'Close'
            });
        }
        if (hasError && dynamicDisplayedComponentsLength > max) {
            return formatMessage({
                id: getTranslation(`components.DynamicZone.extra-components`),
                defaultMessage: 'There {number, plural, =0 {are # extra components} one {is # extra component} other {are # extra components}}'
            }, {
                number: dynamicDisplayedComponentsLength - max
            });
        }
        if (hasError && dynamicDisplayedComponentsLength < min) {
            return formatMessage({
                id: getTranslation(`components.DynamicZone.missing-components`),
                defaultMessage: 'There {number, plural, =0 {are # missing components} one {is # missing component} other {are # missing components}}'
            }, {
                number: min - dynamicDisplayedComponentsLength
            });
        }
        return formatMessage({
            id: getTranslation('components.DynamicZone.add-component'),
            defaultMessage: 'Add a component to {componentName}'
        }, {
            componentName: label || name
        });
    };
    const level = useComponent('DynamicZone', (state)=>state.level);
    const ariaDescriptionId = React.useId();
    return /*#__PURE__*/ jsx(DynamicZoneProvider, {
        isInDynamicZone: true,
        children: /*#__PURE__*/ jsxs(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 6,
            children: [
                dynamicDisplayedComponentsLength > 0 && /*#__PURE__*/ jsxs(Box, {
                    children: [
                        /*#__PURE__*/ jsx(DynamicZoneLabel, {
                            hint: hint,
                            label: label,
                            labelAction: labelAction,
                            name: name,
                            numberOfComponents: dynamicDisplayedComponentsLength,
                            required: required
                        }),
                        /*#__PURE__*/ jsx(VisuallyHidden, {
                            id: ariaDescriptionId,
                            children: formatMessage({
                                id: getTranslation('dnd.instructions'),
                                defaultMessage: `Press spacebar to grab and re-order`
                            })
                        }),
                        /*#__PURE__*/ jsx(VisuallyHidden, {
                            "aria-live": "assertive",
                            children: liveText
                        }),
                        /*#__PURE__*/ jsx("ol", {
                            "aria-describedby": ariaDescriptionId,
                            children: value.map((field, index)=>/*#__PURE__*/ jsx(ComponentProvider, {
                                    level: level + 1,
                                    uid: field.__component,
                                    // id is always a number in a dynamic zone.
                                    id: field.id,
                                    type: "dynamiczone",
                                    children: /*#__PURE__*/ jsx(DynamicComponent, {
                                        disabled: disabled,
                                        name: name,
                                        index: index,
                                        componentUid: field.__component,
                                        onMoveComponent: handleMoveComponent,
                                        onRemoveComponentClick: handleRemoveComponent(name, index),
                                        onCancel: handleCancel,
                                        onDropItem: handleDropItem,
                                        onGrabItem: handleGrabItem,
                                        onAddComponent: handleAddComponent,
                                        dynamicComponentsByCategory: dynamicComponentsByCategory,
                                        children: children
                                    })
                                }, field.__temp_key__))
                        })
                    ]
                }),
                /*#__PURE__*/ jsx(Flex, {
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsx(AddComponentButton, {
                        hasError: hasError,
                        isDisabled: disabled,
                        isOpen: addComponentIsOpen,
                        onClick: handleClickOpenPicker,
                        children: renderButtonLabel()
                    })
                }),
                /*#__PURE__*/ jsx(ComponentPicker, {
                    dynamicComponentsByCategory: dynamicComponentsByCategory,
                    isOpen: addComponentIsOpen,
                    onClickAddComponent: handleAddComponent
                })
            ]
        })
    });
};

export { DynamicZone, useDynamicZone };
//# sourceMappingURL=Field.mjs.map
