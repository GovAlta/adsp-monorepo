'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var useDocument = require('../../../hooks/useDocument.js');
var contentTypes = require('../../../services/contentTypes.js');
var attributes = require('../../../utils/attributes.js');
var translations = require('../../../utils/translations.js');
var DraggableCard = require('./DraggableCard.js');

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

const SortDisplayedFields = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { model, schema } = useDocument.useDoc();
    const [isDraggingSibling, setIsDraggingSibling] = React__namespace.useState(false);
    const [lastAction, setLastAction] = React__namespace.useState(null);
    const scrollableContainerRef = React__namespace.useRef(null);
    const values = strapiAdmin.useForm('SortDisplayedFields', (state)=>state.values.layout ?? []);
    const addFieldRow = strapiAdmin.useForm('SortDisplayedFields', (state)=>state.addFieldRow);
    const removeFieldRow = strapiAdmin.useForm('SortDisplayedFields', (state)=>state.removeFieldRow);
    const moveFieldRow = strapiAdmin.useForm('SortDisplayedFields', (state)=>state.moveFieldRow);
    const { metadata: allMetadata } = contentTypes.useGetContentTypeConfigurationQuery(model, {
        selectFromResult: ({ data })=>({
                metadata: data?.contentType.metadatas ?? {}
            })
    });
    /**
   * This is our list of fields that are not displayed in the current layout
   * so we create their default state to be added to the layout.
   */ const nonDisplayedFields = React__namespace.useMemo(()=>{
        if (!schema) {
            return [];
        }
        const displayedFieldNames = values.map((field)=>field.name);
        return Object.entries(schema.attributes).reduce((acc, [name, attribute])=>{
            if (!displayedFieldNames.includes(name) && attributes.checkIfAttributeIsDisplayable(attribute)) {
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
    React__namespace.useEffect(()=>{
        if (lastAction === 'add' && scrollableContainerRef?.current) {
            scrollableContainerRef.current.scrollLeft = scrollableContainerRef.current.scrollWidth;
        }
    }, [
        lastAction
    ]);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        alignItems: "stretch",
        direction: "column",
        gap: 4,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                variant: "delta",
                tag: "h2",
                children: formatMessage({
                    id: translations.getTranslation('containers.SettingPage.view'),
                    defaultMessage: 'View'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                padding: 4,
                borderColor: "neutral300",
                borderStyle: "dashed",
                borderWidth: "1px",
                hasRadius: true,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        flex: "1",
                        overflow: "auto hidden",
                        ref: scrollableContainerRef,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                            gap: 3,
                            children: values.map((field, index)=>/*#__PURE__*/ jsxRuntime.jsx(DraggableCard.DraggableCard, {
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
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Root, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Trigger, {
                                paddingLeft: 2,
                                paddingRight: 2,
                                justifyContent: "center",
                                endIcon: null,
                                disabled: nonDisplayedFields.length === 0,
                                variant: "tertiary",
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                                        tag: "span",
                                        children: formatMessage({
                                            id: translations.getTranslation('components.FieldSelect.label'),
                                            defaultMessage: 'Add a field'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(Icons.Plus, {
                                        "aria-hidden": true,
                                        focusable: false,
                                        style: {
                                            position: 'relative',
                                            top: 2
                                        }
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Content, {
                                children: nonDisplayedFields.map((field)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
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

exports.SortDisplayedFields = SortDisplayedFields;
//# sourceMappingURL=SortDisplayedFields.js.map
