'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var pipe = require('lodash/fp/pipe');
var reactIntl = require('react-intl');
var useDocumentContext = require('../../../../../hooks/useDocumentContext.js');
var translations = require('../../../../../utils/translations.js');
var data = require('../../../utils/data.js');
var forms = require('../../../utils/forms.js');
var ComponentContext = require('../ComponentContext.js');
var AddComponentButton = require('./AddComponentButton.js');
var ComponentPicker = require('./ComponentPicker.js');
var DynamicComponent = require('./DynamicComponent.js');
var DynamicZoneLabel = require('./DynamicZoneLabel.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const [DynamicZoneProvider, useDynamicZone] = strapiAdmin.createContext('DynamicZone', {
    isInDynamicZone: false
});
const DynamicZone = ({ attribute, disabled: disabledProp, hint, label, labelAction, name, required = false, children })=>{
    // We cannot use the default props here
    const { max = Infinity, min = -Infinity } = attribute ?? {};
    const [addComponentIsOpen, setAddComponentIsOpen] = React__namespace.useState(false);
    const [liveText, setLiveText] = React__namespace.useState('');
    const { currentDocument: { components, isLoading } } = useDocumentContext.useDocumentContext('DynamicZone');
    const disabled = disabledProp || isLoading;
    const { addFieldRow, removeFieldRow, moveFieldRow } = strapiAdmin.useForm('DynamicZone', ({ addFieldRow, removeFieldRow, moveFieldRow })=>({
            addFieldRow,
            removeFieldRow,
            moveFieldRow
        }));
    const { value = [], error } = strapiAdmin.useField(name);
    const dynamicComponentsByCategory = React__namespace.useMemo(()=>{
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
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const dynamicDisplayedComponentsLength = value.length;
    const handleAddComponent = (uid, position)=>{
        setAddComponentIsOpen(false);
        const schema = components[uid];
        const form = forms.createDefaultForm(schema, components);
        const transformations = pipe(data.transformDocument(schema, components), (data)=>({
                ...data,
                __component: uid
            }));
        const data$1 = transformations(form);
        addFieldRow(name, data$1, position);
    };
    const handleClickOpenPicker = ()=>{
        if (dynamicDisplayedComponentsLength < max) {
            setAddComponentIsOpen((prev)=>!prev);
        } else {
            toggleNotification({
                type: 'info',
                message: formatMessage({
                    id: translations.getTranslation('components.notification.info.maximum-requirement')
                })
            });
        }
    };
    const handleMoveComponent = (newIndex, currentIndex)=>{
        setLiveText(formatMessage({
            id: translations.getTranslation('dnd.reorder'),
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
            id: translations.getTranslation('dnd.cancel-item'),
            defaultMessage: '{item}, dropped. Re-order cancelled.'
        }, {
            item: `${name}.${index}`
        }));
    };
    const handleGrabItem = (index)=>{
        setLiveText(formatMessage({
            id: translations.getTranslation('dnd.grab-item'),
            defaultMessage: `{item}, grabbed. Current position in list: {position}. Press up and down arrow to change position, Spacebar to drop, Escape to cancel.`
        }, {
            item: `${name}.${index}`,
            position: getItemPos(index)
        }));
    };
    const handleDropItem = (index)=>{
        setLiveText(formatMessage({
            id: translations.getTranslation('dnd.drop-item'),
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
                id: translations.getTranslation(`components.DynamicZone.extra-components`),
                defaultMessage: 'There {number, plural, =0 {are # extra components} one {is # extra component} other {are # extra components}}'
            }, {
                number: dynamicDisplayedComponentsLength - max
            });
        }
        if (hasError && dynamicDisplayedComponentsLength < min) {
            return formatMessage({
                id: translations.getTranslation(`components.DynamicZone.missing-components`),
                defaultMessage: 'There {number, plural, =0 {are # missing components} one {is # missing component} other {are # missing components}}'
            }, {
                number: min - dynamicDisplayedComponentsLength
            });
        }
        return formatMessage({
            id: translations.getTranslation('components.DynamicZone.add-component'),
            defaultMessage: 'Add a component to {componentName}'
        }, {
            componentName: label || name
        });
    };
    const level = ComponentContext.useComponent('DynamicZone', (state)=>state.level);
    const ariaDescriptionId = React__namespace.useId();
    return /*#__PURE__*/ jsxRuntime.jsx(DynamicZoneProvider, {
        isInDynamicZone: true,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 6,
            children: [
                dynamicDisplayedComponentsLength > 0 && /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(DynamicZoneLabel.DynamicZoneLabel, {
                            hint: hint,
                            label: label,
                            labelAction: labelAction,
                            name: name,
                            numberOfComponents: dynamicDisplayedComponentsLength,
                            required: required
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                            id: ariaDescriptionId,
                            children: formatMessage({
                                id: translations.getTranslation('dnd.instructions'),
                                defaultMessage: `Press spacebar to grab and re-order`
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                            "aria-live": "assertive",
                            children: liveText
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx("ol", {
                            "aria-describedby": ariaDescriptionId,
                            children: value.map((field, index)=>/*#__PURE__*/ jsxRuntime.jsx(ComponentContext.ComponentProvider, {
                                    level: level + 1,
                                    uid: field.__component,
                                    // id is always a number in a dynamic zone.
                                    id: field.id,
                                    type: "dynamiczone",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(DynamicComponent.DynamicComponent, {
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
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsxRuntime.jsx(AddComponentButton.AddComponentButton, {
                        hasError: hasError,
                        isDisabled: disabled,
                        isOpen: addComponentIsOpen,
                        onClick: handleClickOpenPicker,
                        children: renderButtonLabel()
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(ComponentPicker.ComponentPicker, {
                    dynamicComponentsByCategory: dynamicComponentsByCategory,
                    isOpen: addComponentIsOpen,
                    onClickAddComponent: handleAddComponent
                })
            ]
        })
    });
};

exports.DynamicZone = DynamicZone;
exports.useDynamicZone = useDynamicZone;
//# sourceMappingURL=Field.js.map
