'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var get = require('lodash/get');
var upperFirst = require('lodash/upperFirst');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');
var Curve = require('../icons/Curve.js');
var conditions = require('../utils/conditions.js');
var getAttributeDisplayedType = require('../utils/getAttributeDisplayedType.js');
var getRelationType = require('../utils/getRelationType.js');
var getTrad = require('../utils/getTrad.js');
var AttributeIcon = require('./AttributeIcon.js');
var ComponentList = require('./ComponentList.js');
var useDataManager = require('./DataManager/useDataManager.js');
var DisplayedType = require('./DisplayedType.js');
var DynamicZoneList = require('./DynamicZoneList.js');
var useFormModalNavigation = require('./FormModalNavigation/useFormModalNavigation.js');
var Status = require('./Status.js');

const GridWrapper = styledComponents.styled(designSystem.Flex)`
  justify-content: space-between;

  border-top: ${({ theme, $isOverlay })=>$isOverlay ? 'none' : `1px solid ${theme.colors.neutral150}`};

  padding-top: ${({ theme })=>theme.spaces[4]};
  padding-bottom: ${({ theme })=>theme.spaces[4]};

  opacity: ${({ $isDragging })=>$isDragging ? 0 : 1};
  align-items: center;
`;
const StyledAttributeRow = styledComponents.styled(designSystem.Box)`
  list-style: none;
  list-style-type: none;
`;
const AttributeRow = /*#__PURE__*/ React.forwardRef((props, ref)=>{
    const { style, ...rest } = props;
    return /*#__PURE__*/ jsxRuntime.jsx(StyledAttributeRow, {
        tag: "li",
        ref: ref,
        ...props.attributes,
        style: style,
        background: "neutral0",
        shadow: props.isOverlay ? 'filterShadow' : 'none',
        "aria-label": props.item.name,
        children: /*#__PURE__*/ jsxRuntime.jsx(MemoizedRow, {
            ...rest
        })
    });
});
const MemoizedRow = /*#__PURE__*/ React.memo((props)=>{
    const { item, firstLoopComponentUid, isFromDynamicZone, addComponentToDZ, secondLoopComponentUid, type, isDragging, isOverlay, handleRef, listeners } = props;
    const shouldHideNestedInfos = isOverlay || isDragging;
    const [isOpen, setIsOpen] = React.useState(true);
    const isTypeDeleted = type.status === 'REMOVED';
    const { contentTypes, removeAttribute, isInDevelopmentMode } = useDataManager.useDataManager();
    const { onOpenModalEditField, onOpenModalEditCustomField } = useFormModalNavigation.useFormModalNavigation();
    const { formatMessage } = reactIntl.useIntl();
    const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
    const isDeleted = item.status === 'REMOVED';
    const isMorph = item.type === 'relation' && item.relation.includes('morph');
    const ico = [
        'integer',
        'biginteger',
        'float',
        'decimal'
    ].includes(item.type) ? 'number' : item.type;
    const targetContentType = item.type === 'relation' ? get(contentTypes, item.target) : null;
    const isPluginContentType = get(targetContentType, 'plugin');
    const src = 'target' in item && item.target ? 'relation' : ico;
    const handleDelete = (e)=>{
        e.stopPropagation();
        const dependentRows = conditions.checkDependentRows(contentTypes, item.name);
        if (dependentRows.length > 0) {
            setShowConfirmDialog(true);
        } else {
            removeAttribute({
                forTarget: type.modelType,
                targetUid: type.uid,
                attributeToRemoveName: item.name
            });
        }
    };
    const handleConfirmDelete = ()=>{
        removeAttribute({
            forTarget: type.modelType,
            targetUid: type.uid,
            attributeToRemoveName: item.name
        });
        setShowConfirmDialog(false);
    };
    const handleCancelDelete = ()=>{
        setShowConfirmDialog(false);
    };
    const handleClick = ()=>{
        if (isMorph) {
            return;
        }
        if (item.configurable !== false) {
            const editTargetUid = secondLoopComponentUid || firstLoopComponentUid || type.uid;
            const attributeType = getAttributeDisplayedType.getAttributeDisplayedType(item.type);
            const step = item.type === 'component' ? '2' : null;
            if (item.customField) {
                onOpenModalEditCustomField({
                    forTarget: type.modelType,
                    targetUid: editTargetUid,
                    attributeName: item.name,
                    attributeType,
                    customFieldUid: item.customField
                });
            } else {
                onOpenModalEditField({
                    forTarget: type.modelType,
                    targetUid: editTargetUid,
                    attributeName: item.name,
                    attributeType,
                    step
                });
            }
        }
    };
    let loopNumber;
    if (secondLoopComponentUid && firstLoopComponentUid) {
        loopNumber = 2;
    } else if (firstLoopComponentUid) {
        loopNumber = 1;
    } else {
        loopNumber = 0;
    }
    const canEdit = !isTypeDeleted && !isDeleted;
    const canDelete = !isTypeDeleted && !isDeleted;
    const cursor = isTypeDeleted || isDeleted ? 'not-allowed' : 'move';
    const canClick = isInDevelopmentMode && item.configurable !== false && !isMorph && canEdit;
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(GridWrapper, {
                $isOverlay: isOverlay,
                $isDragging: isDragging,
                onClick: canClick ? handleClick : undefined,
                paddingLeft: 4,
                paddingRight: 4,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        alignItems: "center",
                        overflow: "hidden",
                        gap: 2,
                        children: [
                            loopNumber !== 0 && !isOverlay && /*#__PURE__*/ jsxRuntime.jsx(Curve.Curve, {
                                color: isFromDynamicZone ? 'primary200' : 'neutral150'
                            }),
                            isInDevelopmentMode && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                cursor: cursor,
                                role: "Handle",
                                ref: handleRef,
                                ...listeners,
                                variant: "ghost",
                                withTooltip: false,
                                label: `${formatMessage({
                                    id: 'app.utils.drag',
                                    defaultMessage: 'Drag'
                                })} ${item.name}`,
                                disabled: isTypeDeleted || isDeleted,
                                children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Drag, {})
                            }),
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                gap: 4,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        gap: 4,
                                        alignItems: "center",
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(AttributeIcon.AttributeIcon, {
                                                type: src,
                                                customField: item.customField
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                                                textColor: "neutral800",
                                                fontWeight: "bold",
                                                textDecoration: isDeleted ? 'line-through' : 'none',
                                                ellipsis: true,
                                                overflow: "hidden",
                                                children: [
                                                    item.name,
                                                    'required' in item && item.required && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                        textColor: "danger600",
                                                        children: "* "
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                                            textColor: "neutral600",
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsx(DisplayedType.DisplayedType, {
                                                    type: item.type,
                                                    customField: item.customField,
                                                    repeatable: 'repeatable' in item && item.repeatable,
                                                    multiple: 'multiple' in item && item.multiple
                                                }),
                                                'conditions' in item && item.conditions && Object.keys(item.conditions).length > 0 && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Badge, {
                                                    margin: 4,
                                                    children: "conditional"
                                                }),
                                                item.type === 'relation' && /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                                                    children: [
                                                        " (",
                                                        getRelationType.getRelationType(item.relation, item.targetAttribute),
                                                        ") ",
                                                        targetContentType && formatMessage({
                                                            id: getTrad.getTrad('modelPage.attribute.with'),
                                                            defaultMessage: 'with'
                                                        }),
                                                        " ",
                                                        targetContentType && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                                                            onClick: (e)=>e.stopPropagation(),
                                                            tag: reactRouterDom.Link,
                                                            to: `/plugins/content-type-builder/content-types/${targetContentType.uid}`,
                                                            children: upperFirst(targetContentType.info.displayName)
                                                        }),
                                                        isPluginContentType && `(${formatMessage({
                                                            id: getTrad.getTrad(`from`),
                                                            defaultMessage: 'from'
                                                        })}: ${isPluginContentType})`
                                                    ]
                                                }),
                                                item.type === 'component' && /*#__PURE__*/ jsxRuntime.jsx(ComponentLink, {
                                                    uid: item.component
                                                })
                                            ]
                                        })
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                            justifyContent: "flex-end",
                            gap: 1,
                            onClick: (e)=>e.stopPropagation(),
                            children: /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                        children: item.status && /*#__PURE__*/ jsxRuntime.jsx(Status.StatusBadge, {
                                            status: item.status
                                        })
                                    }),
                                    [
                                        'component',
                                        'dynamiczone'
                                    ].includes(item.type) && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                        onClick: (e)=>{
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (isOpen) {
                                                setIsOpen(false);
                                            } else {
                                                setIsOpen(true);
                                            }
                                        },
                                        "aria-expanded": isOpen,
                                        label: formatMessage({
                                            id: 'app.utils.toggle',
                                            defaultMessage: 'Toggle'
                                        }),
                                        variant: "ghost",
                                        withTooltip: false,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.ChevronDown, {
                                            "aria-hidden": true,
                                            fill: "neutral500",
                                            style: {
                                                transform: `rotate(${isOpen ? '0deg' : '-90deg'})`,
                                                transition: 'transform 0.5s'
                                            }
                                        })
                                    }),
                                    isInDevelopmentMode && item.configurable !== false ? /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                                        children: [
                                            !isMorph && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                                onClick: handleClick,
                                                label: `${formatMessage({
                                                    id: 'app.utils.edit',
                                                    defaultMessage: 'Edit'
                                                })} ${item.name}`,
                                                variant: "ghost",
                                                disabled: !canEdit,
                                                children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Pencil, {})
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                                onClick: handleDelete,
                                                label: `${formatMessage({
                                                    id: 'global.delete',
                                                    defaultMessage: 'Delete'
                                                })} ${item.name}`,
                                                variant: "ghost",
                                                disabled: !canDelete,
                                                children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Trash, {})
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
                                                open: showConfirmDialog,
                                                onOpenChange: setShowConfirmDialog,
                                                children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
                                                    onConfirm: handleConfirmDelete,
                                                    onCancel: handleCancelDelete,
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                                                            children: [
                                                                formatMessage({
                                                                    id: getTrad.getTrad('popUpWarning.bodyMessage.delete-attribute-with-conditions'),
                                                                    defaultMessage: 'The following fields have conditions that depend on this field: '
                                                                }),
                                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                    fontWeight: "bold",
                                                                    children: conditions.checkDependentRows(contentTypes, item.name).map(({ attribute })=>attribute).join(', ')
                                                                }),
                                                                formatMessage({
                                                                    id: getTrad.getTrad('popUpWarning.bodyMessage.delete-attribute-with-conditions-end'),
                                                                    defaultMessage: '. Are you sure you want to delete it?'
                                                                })
                                                            ]
                                                        })
                                                    })
                                                })
                                            })
                                        ]
                                    }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                        padding: 2,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Lock, {
                                            fill: "neutral500"
                                        })
                                    })
                                ]
                            })
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(SubRow, {
                $shouldHideNestedInfos: shouldHideNestedInfos,
                $isOpen: isOpen,
                children: [
                    item.type === 'component' && /*#__PURE__*/ jsxRuntime.jsx(ComponentList.ComponentList, {
                        ...item,
                        isFromDynamicZone: isFromDynamicZone,
                        firstLoopComponentUid: firstLoopComponentUid
                    }),
                    item.type === 'dynamiczone' && /*#__PURE__*/ jsxRuntime.jsx(DynamicZoneList.DynamicZoneList, {
                        ...item,
                        disabled: isTypeDeleted || item.status === 'REMOVED',
                        addComponent: addComponentToDZ,
                        forTarget: type.modelType,
                        targetUid: type.uid
                    })
                ]
            })
        ]
    });
});
const SubRow = styledComponents.styled(designSystem.Box)`
  display: ${({ $shouldHideNestedInfos })=>$shouldHideNestedInfos ? 'none' : 'block'};
  max-height: ${({ $isOpen })=>$isOpen ? '9999px' : '0px'};
  overflow: hidden;

  transition: ${({ $isOpen })=>$isOpen ? 'max-height 1s ease-in-out' : 'max-height 0.5s cubic-bezier(0, 1, 0, 1)'};
`;
const ComponentLink = ({ uid })=>{
    const { components } = useDataManager.useDataManager();
    const type = get(components, uid);
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            " (",
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                onClick: (e)=>e.stopPropagation(),
                tag: reactRouterDom.Link,
                to: `/plugins/content-type-builder/component-categories/${type.category}/${type.uid}`,
                children: upperFirst(type.info.displayName)
            }),
            ")"
        ]
    });
};

exports.AttributeRow = AttributeRow;
exports.GridWrapper = GridWrapper;
//# sourceMappingURL=AttributeRow.js.map
