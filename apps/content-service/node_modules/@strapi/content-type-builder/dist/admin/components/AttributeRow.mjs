import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { forwardRef, memo, useState } from 'react';
import { ConfirmDialog } from '@strapi/admin/strapi-admin';
import { Flex, Box, IconButton, Typography, Badge, Link, Dialog } from '@strapi/design-system';
import { Drag, ChevronDown, Pencil, Trash, Lock } from '@strapi/icons';
import get from 'lodash/get';
import upperFirst from 'lodash/upperFirst';
import { useIntl } from 'react-intl';
import { Link as Link$1 } from 'react-router-dom';
import { styled } from 'styled-components';
import { Curve } from '../icons/Curve.mjs';
import { checkDependentRows } from '../utils/conditions.mjs';
import { getAttributeDisplayedType } from '../utils/getAttributeDisplayedType.mjs';
import { getRelationType } from '../utils/getRelationType.mjs';
import { getTrad } from '../utils/getTrad.mjs';
import { AttributeIcon } from './AttributeIcon.mjs';
import { ComponentList } from './ComponentList.mjs';
import { useDataManager } from './DataManager/useDataManager.mjs';
import { DisplayedType } from './DisplayedType.mjs';
import { DynamicZoneList } from './DynamicZoneList.mjs';
import { useFormModalNavigation } from './FormModalNavigation/useFormModalNavigation.mjs';
import { StatusBadge } from './Status.mjs';

const GridWrapper = styled(Flex)`
  justify-content: space-between;

  border-top: ${({ theme, $isOverlay })=>$isOverlay ? 'none' : `1px solid ${theme.colors.neutral150}`};

  padding-top: ${({ theme })=>theme.spaces[4]};
  padding-bottom: ${({ theme })=>theme.spaces[4]};

  opacity: ${({ $isDragging })=>$isDragging ? 0 : 1};
  align-items: center;
`;
const StyledAttributeRow = styled(Box)`
  list-style: none;
  list-style-type: none;
`;
const AttributeRow = /*#__PURE__*/ forwardRef((props, ref)=>{
    const { style, ...rest } = props;
    return /*#__PURE__*/ jsx(StyledAttributeRow, {
        tag: "li",
        ref: ref,
        ...props.attributes,
        style: style,
        background: "neutral0",
        shadow: props.isOverlay ? 'filterShadow' : 'none',
        "aria-label": props.item.name,
        children: /*#__PURE__*/ jsx(MemoizedRow, {
            ...rest
        })
    });
});
const MemoizedRow = /*#__PURE__*/ memo((props)=>{
    const { item, firstLoopComponentUid, isFromDynamicZone, addComponentToDZ, secondLoopComponentUid, type, isDragging, isOverlay, handleRef, listeners } = props;
    const shouldHideNestedInfos = isOverlay || isDragging;
    const [isOpen, setIsOpen] = useState(true);
    const isTypeDeleted = type.status === 'REMOVED';
    const { contentTypes, removeAttribute, isInDevelopmentMode } = useDataManager();
    const { onOpenModalEditField, onOpenModalEditCustomField } = useFormModalNavigation();
    const { formatMessage } = useIntl();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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
        const dependentRows = checkDependentRows(contentTypes, item.name);
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
            const attributeType = getAttributeDisplayedType(item.type);
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
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsxs(GridWrapper, {
                $isOverlay: isOverlay,
                $isDragging: isDragging,
                onClick: canClick ? handleClick : undefined,
                paddingLeft: 4,
                paddingRight: 4,
                children: [
                    /*#__PURE__*/ jsxs(Flex, {
                        alignItems: "center",
                        overflow: "hidden",
                        gap: 2,
                        children: [
                            loopNumber !== 0 && !isOverlay && /*#__PURE__*/ jsx(Curve, {
                                color: isFromDynamicZone ? 'primary200' : 'neutral150'
                            }),
                            isInDevelopmentMode && /*#__PURE__*/ jsx(IconButton, {
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
                                children: /*#__PURE__*/ jsx(Drag, {})
                            }),
                            /*#__PURE__*/ jsxs(Flex, {
                                gap: 4,
                                children: [
                                    /*#__PURE__*/ jsxs(Flex, {
                                        gap: 4,
                                        alignItems: "center",
                                        children: [
                                            /*#__PURE__*/ jsx(AttributeIcon, {
                                                type: src,
                                                customField: item.customField
                                            }),
                                            /*#__PURE__*/ jsxs(Typography, {
                                                textColor: "neutral800",
                                                fontWeight: "bold",
                                                textDecoration: isDeleted ? 'line-through' : 'none',
                                                ellipsis: true,
                                                overflow: "hidden",
                                                children: [
                                                    item.name,
                                                    'required' in item && item.required && /*#__PURE__*/ jsx(Typography, {
                                                        textColor: "danger600",
                                                        children: "* "
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx(Flex, {
                                        children: /*#__PURE__*/ jsxs(Typography, {
                                            textColor: "neutral600",
                                            children: [
                                                /*#__PURE__*/ jsx(DisplayedType, {
                                                    type: item.type,
                                                    customField: item.customField,
                                                    repeatable: 'repeatable' in item && item.repeatable,
                                                    multiple: 'multiple' in item && item.multiple
                                                }),
                                                'conditions' in item && item.conditions && Object.keys(item.conditions).length > 0 && /*#__PURE__*/ jsx(Badge, {
                                                    margin: 4,
                                                    children: "conditional"
                                                }),
                                                item.type === 'relation' && /*#__PURE__*/ jsxs(Fragment, {
                                                    children: [
                                                        " (",
                                                        getRelationType(item.relation, item.targetAttribute),
                                                        ") ",
                                                        targetContentType && formatMessage({
                                                            id: getTrad('modelPage.attribute.with'),
                                                            defaultMessage: 'with'
                                                        }),
                                                        " ",
                                                        targetContentType && /*#__PURE__*/ jsx(Link, {
                                                            onClick: (e)=>e.stopPropagation(),
                                                            tag: Link$1,
                                                            to: `/plugins/content-type-builder/content-types/${targetContentType.uid}`,
                                                            children: upperFirst(targetContentType.info.displayName)
                                                        }),
                                                        isPluginContentType && `(${formatMessage({
                                                            id: getTrad(`from`),
                                                            defaultMessage: 'from'
                                                        })}: ${isPluginContentType})`
                                                    ]
                                                }),
                                                item.type === 'component' && /*#__PURE__*/ jsx(ComponentLink, {
                                                    uid: item.component
                                                })
                                            ]
                                        })
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(Box, {
                        children: /*#__PURE__*/ jsx(Flex, {
                            justifyContent: "flex-end",
                            gap: 1,
                            onClick: (e)=>e.stopPropagation(),
                            children: /*#__PURE__*/ jsxs(Fragment, {
                                children: [
                                    /*#__PURE__*/ jsx(Box, {
                                        children: item.status && /*#__PURE__*/ jsx(StatusBadge, {
                                            status: item.status
                                        })
                                    }),
                                    [
                                        'component',
                                        'dynamiczone'
                                    ].includes(item.type) && /*#__PURE__*/ jsx(IconButton, {
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
                                        children: /*#__PURE__*/ jsx(ChevronDown, {
                                            "aria-hidden": true,
                                            fill: "neutral500",
                                            style: {
                                                transform: `rotate(${isOpen ? '0deg' : '-90deg'})`,
                                                transition: 'transform 0.5s'
                                            }
                                        })
                                    }),
                                    isInDevelopmentMode && item.configurable !== false ? /*#__PURE__*/ jsxs(Fragment, {
                                        children: [
                                            !isMorph && /*#__PURE__*/ jsx(IconButton, {
                                                onClick: handleClick,
                                                label: `${formatMessage({
                                                    id: 'app.utils.edit',
                                                    defaultMessage: 'Edit'
                                                })} ${item.name}`,
                                                variant: "ghost",
                                                disabled: !canEdit,
                                                children: /*#__PURE__*/ jsx(Pencil, {})
                                            }),
                                            /*#__PURE__*/ jsx(IconButton, {
                                                onClick: handleDelete,
                                                label: `${formatMessage({
                                                    id: 'global.delete',
                                                    defaultMessage: 'Delete'
                                                })} ${item.name}`,
                                                variant: "ghost",
                                                disabled: !canDelete,
                                                children: /*#__PURE__*/ jsx(Trash, {})
                                            }),
                                            /*#__PURE__*/ jsx(Dialog.Root, {
                                                open: showConfirmDialog,
                                                onOpenChange: setShowConfirmDialog,
                                                children: /*#__PURE__*/ jsx(ConfirmDialog, {
                                                    onConfirm: handleConfirmDelete,
                                                    onCancel: handleCancelDelete,
                                                    children: /*#__PURE__*/ jsx(Box, {
                                                        children: /*#__PURE__*/ jsxs(Typography, {
                                                            children: [
                                                                formatMessage({
                                                                    id: getTrad('popUpWarning.bodyMessage.delete-attribute-with-conditions'),
                                                                    defaultMessage: 'The following fields have conditions that depend on this field: '
                                                                }),
                                                                /*#__PURE__*/ jsx(Typography, {
                                                                    fontWeight: "bold",
                                                                    children: checkDependentRows(contentTypes, item.name).map(({ attribute })=>attribute).join(', ')
                                                                }),
                                                                formatMessage({
                                                                    id: getTrad('popUpWarning.bodyMessage.delete-attribute-with-conditions-end'),
                                                                    defaultMessage: '. Are you sure you want to delete it?'
                                                                })
                                                            ]
                                                        })
                                                    })
                                                })
                                            })
                                        ]
                                    }) : /*#__PURE__*/ jsx(Flex, {
                                        padding: 2,
                                        children: /*#__PURE__*/ jsx(Lock, {
                                            fill: "neutral500"
                                        })
                                    })
                                ]
                            })
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxs(SubRow, {
                $shouldHideNestedInfos: shouldHideNestedInfos,
                $isOpen: isOpen,
                children: [
                    item.type === 'component' && /*#__PURE__*/ jsx(ComponentList, {
                        ...item,
                        isFromDynamicZone: isFromDynamicZone,
                        firstLoopComponentUid: firstLoopComponentUid
                    }),
                    item.type === 'dynamiczone' && /*#__PURE__*/ jsx(DynamicZoneList, {
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
const SubRow = styled(Box)`
  display: ${({ $shouldHideNestedInfos })=>$shouldHideNestedInfos ? 'none' : 'block'};
  max-height: ${({ $isOpen })=>$isOpen ? '9999px' : '0px'};
  overflow: hidden;

  transition: ${({ $isOpen })=>$isOpen ? 'max-height 1s ease-in-out' : 'max-height 0.5s cubic-bezier(0, 1, 0, 1)'};
`;
const ComponentLink = ({ uid })=>{
    const { components } = useDataManager();
    const type = get(components, uid);
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            " (",
            /*#__PURE__*/ jsx(Link, {
                onClick: (e)=>e.stopPropagation(),
                tag: Link$1,
                to: `/plugins/content-type-builder/component-categories/${type.category}/${type.uid}`,
                children: upperFirst(type.info.displayName)
            }),
            ")"
        ]
    });
};

export { AttributeRow, GridWrapper };
//# sourceMappingURL=AttributeRow.mjs.map
