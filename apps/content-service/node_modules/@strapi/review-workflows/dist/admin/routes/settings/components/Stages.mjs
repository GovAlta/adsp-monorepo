import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking, useForm, useField, InputRenderer as InputRenderer$1, useNotification, ConfirmDialog } from '@strapi/admin/strapi-admin';
import { Box, Accordion, Menu, MultiSelectOption, Flex, useComposedRefs, VisuallyHidden, IconButton, Grid, Field, SingleSelect, SingleSelectOption, TextInput, MultiSelect, MultiSelectGroup, Dialog } from '@strapi/design-system';
import { More, Drag, EyeStriked, Duplicate } from '@strapi/icons';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { useGetAdminRolesQuery } from '../../../services/admin.mjs';
import { AVAILABLE_COLORS, getStageColorByHex } from '../../../utils/colors.mjs';
import { DRAG_DROP_TYPES } from '../constants.mjs';
import { useDragAndDrop } from '../hooks/useDragAndDrop.mjs';
import { AddStage } from './AddStage.mjs';

const Stages = ({ canDelete = true, canUpdate = true, isCreating })=>{
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const addFieldRow = useForm('Stages', (state)=>state.addFieldRow);
    const { value: stages = [] } = useField('stages');
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        gap: 6,
        width: "100%",
        children: [
            /*#__PURE__*/ jsxs(Box, {
                position: "relative",
                width: "100%",
                children: [
                    /*#__PURE__*/ jsx(Background, {
                        background: "neutral200",
                        height: "100%",
                        left: "50%",
                        position: "absolute",
                        top: "0",
                        width: 2
                    }),
                    /*#__PURE__*/ jsx(Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 6,
                        position: "relative",
                        tag: "ol",
                        children: stages.map((stage, index)=>{
                            return /*#__PURE__*/ jsx(Box, {
                                tag: "li",
                                children: /*#__PURE__*/ jsx(Stage, {
                                    index: index,
                                    canDelete: stages.length > 1 && canDelete,
                                    canReorder: stages.length > 1,
                                    canUpdate: canUpdate,
                                    stagesCount: stages.length,
                                    defaultOpen: !stage.id,
                                    ...stage
                                })
                            }, stage.__temp_key__);
                        })
                    })
                ]
            }),
            canUpdate && /*#__PURE__*/ jsx(AddStage, {
                type: "button",
                onClick: ()=>{
                    addFieldRow('stages', {
                        name: ''
                    });
                    trackUsage('willCreateStage');
                },
                children: formatMessage({
                    id: 'Settings.review-workflows.stage.add',
                    defaultMessage: 'Add new stage'
                })
            })
        ]
    });
};
const Background = styled(Box)`
  transform: translateX(-50%);
`;
const Stage = ({ index, canDelete = false, canReorder = false, canUpdate = false, stagesCount, name, permissions, color, defaultOpen })=>{
    const [liveText, setLiveText] = React.useState();
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const stageErrors = useForm('Stages', (state)=>state.errors.stages);
    const error = stageErrors?.[index];
    const addFieldRow = useForm('Stage', (state)=>state.addFieldRow);
    const moveFieldRow = useForm('Stage', (state)=>state.moveFieldRow);
    const removeFieldRow = useForm('Stage', (state)=>state.removeFieldRow);
    const getItemPos = (index)=>`${index + 1} of ${stagesCount}`;
    const handleGrabStage = (index)=>{
        setLiveText(formatMessage({
            id: 'dnd.grab-item',
            defaultMessage: `{item}, grabbed. Current position in list: {position}. Press up and down arrow to change position, Spacebar to drop, Escape to cancel.`
        }, {
            item: name,
            position: getItemPos(index)
        }));
    };
    const handleDropStage = (index)=>{
        setLiveText(formatMessage({
            id: 'dnd.drop-item',
            defaultMessage: `{item}, dropped. Final position in list: {position}.`
        }, {
            item: name,
            position: getItemPos(index)
        }));
    };
    const handleCancelDragStage = ()=>{
        setLiveText(formatMessage({
            id: 'dnd.cancel-item',
            defaultMessage: '{item}, dropped. Re-order cancelled.'
        }, {
            item: name
        }));
    };
    const handleMoveStage = (newIndex, oldIndex)=>{
        setLiveText(formatMessage({
            id: 'dnd.reorder',
            defaultMessage: '{item}, moved. New position in list: {position}.'
        }, {
            item: name,
            position: getItemPos(newIndex)
        }));
        moveFieldRow('stages', oldIndex, newIndex);
    };
    const [{ handlerId, isDragging, handleKeyDown }, stageRef, dropRef, dragRef, dragPreviewRef] = useDragAndDrop(canReorder, {
        index,
        item: {
            index,
            name
        },
        onGrabItem: handleGrabStage,
        onDropItem: handleDropStage,
        onMoveItem: handleMoveStage,
        onCancel: handleCancelDragStage,
        type: DRAG_DROP_TYPES.STAGE
    });
    // @ts-expect-error – the stageRef is incorrectly typed.
    const composedRef = useComposedRefs(stageRef, dropRef);
    React.useEffect(()=>{
        dragPreviewRef(getEmptyImage(), {
            captureDraggingState: false
        });
    }, [
        dragPreviewRef,
        index
    ]);
    const handleCloneClick = ()=>{
        addFieldRow('stages', {
            name,
            color,
            permissions
        });
    };
    const id = React.useId();
    return /*#__PURE__*/ jsxs(Box, {
        ref: composedRef,
        shadow: "tableShadow",
        children: [
            liveText && /*#__PURE__*/ jsx(VisuallyHidden, {
                "aria-live": "assertive",
                children: liveText
            }),
            isDragging ? /*#__PURE__*/ jsx(Box, {
                background: "primary100",
                borderStyle: "dashed",
                borderColor: "primary600",
                borderWidth: "1px",
                display: "block",
                hasRadius: true,
                padding: 6
            }) : /*#__PURE__*/ jsx(AccordionRoot, {
                onValueChange: (value)=>{
                    if (value) {
                        trackUsage('willEditStage');
                    }
                },
                defaultValue: defaultOpen ? id : undefined,
                $error: Object.values(error ?? {}).length > 0,
                children: /*#__PURE__*/ jsxs(Accordion.Item, {
                    value: id,
                    children: [
                        /*#__PURE__*/ jsxs(Accordion.Header, {
                            children: [
                                /*#__PURE__*/ jsx(Accordion.Trigger, {
                                    children: name
                                }),
                                /*#__PURE__*/ jsx(Accordion.Actions, {
                                    children: canDelete || canUpdate ? /*#__PURE__*/ jsxs(Fragment, {
                                        children: [
                                            /*#__PURE__*/ jsxs(Menu.Root, {
                                                children: [
                                                    /*#__PURE__*/ jsxs(ContextMenuTrigger, {
                                                        size: "S",
                                                        endIcon: null,
                                                        paddingLeft: 2,
                                                        paddingRight: 2,
                                                        children: [
                                                            /*#__PURE__*/ jsx(More, {
                                                                "aria-hidden": true,
                                                                focusable: false
                                                            }),
                                                            /*#__PURE__*/ jsx(VisuallyHidden, {
                                                                tag: "span",
                                                                children: formatMessage({
                                                                    id: '[tbdb].components.DynamicZone.more-actions',
                                                                    defaultMessage: 'More actions'
                                                                })
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ jsx(Menu.Content, {
                                                        popoverPlacement: "bottom-end",
                                                        zIndex: 2,
                                                        children: /*#__PURE__*/ jsxs(Menu.SubRoot, {
                                                            children: [
                                                                canUpdate && /*#__PURE__*/ jsx(Menu.Item, {
                                                                    onClick: handleCloneClick,
                                                                    children: formatMessage({
                                                                        id: 'Settings.review-workflows.stage.delete',
                                                                        defaultMessage: 'Duplicate stage'
                                                                    })
                                                                }),
                                                                canDelete && /*#__PURE__*/ jsx(Menu.Item, {
                                                                    onClick: ()=>removeFieldRow('stages', index),
                                                                    variant: "danger",
                                                                    children: formatMessage({
                                                                        id: 'Settings.review-workflows.stage.delete',
                                                                        defaultMessage: 'Delete'
                                                                    })
                                                                })
                                                            ]
                                                        })
                                                    })
                                                ]
                                            }),
                                            canUpdate && /*#__PURE__*/ jsx(IconButton, {
                                                background: "transparent",
                                                hasRadius: true,
                                                variant: "ghost",
                                                "data-handler-id": handlerId,
                                                ref: dragRef,
                                                label: formatMessage({
                                                    id: 'Settings.review-workflows.stage.drag',
                                                    defaultMessage: 'Drag'
                                                }),
                                                onClick: (e)=>e.stopPropagation(),
                                                onKeyDown: handleKeyDown,
                                                children: /*#__PURE__*/ jsx(Drag, {})
                                            })
                                        ]
                                    }) : null
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsx(Accordion.Content, {
                            children: /*#__PURE__*/ jsx(Grid.Root, {
                                gap: 4,
                                padding: 6,
                                children: [
                                    {
                                        disabled: !canUpdate,
                                        label: formatMessage({
                                            id: 'Settings.review-workflows.stage.name.label',
                                            defaultMessage: 'Stage name'
                                        }),
                                        name: `stages.${index}.name`,
                                        required: true,
                                        size: 6,
                                        type: 'string'
                                    },
                                    {
                                        disabled: !canUpdate,
                                        label: formatMessage({
                                            id: 'content-manager.reviewWorkflows.stage.color',
                                            defaultMessage: 'Color'
                                        }),
                                        name: `stages.${index}.color`,
                                        required: true,
                                        size: 6,
                                        type: 'color'
                                    },
                                    {
                                        disabled: !canUpdate,
                                        label: formatMessage({
                                            id: 'Settings.review-workflows.stage.permissions.label',
                                            defaultMessage: 'Roles that can change this stage'
                                        }),
                                        name: `stages.${index}.permissions`,
                                        placeholder: formatMessage({
                                            id: 'Settings.review-workflows.stage.permissions.placeholder',
                                            defaultMessage: 'Select a role'
                                        }),
                                        required: true,
                                        size: 6,
                                        type: 'permissions'
                                    }
                                ].map(({ size, ...field })=>/*#__PURE__*/ jsx(Grid.Item, {
                                        col: size,
                                        direction: "column",
                                        alignItems: "stretch",
                                        children: /*#__PURE__*/ jsx(InputRenderer, {
                                            ...field
                                        })
                                    }, field.name))
                            })
                        })
                    ]
                })
            })
        ]
    });
};
const AccordionRoot = styled(Accordion.Root)`
  border: 1px solid
    ${({ theme, $error })=>$error ? theme.colors.danger600 : theme.colors.neutral200};
`;
// Removing the font-size from the child-span aligns the
// more icon vertically
const ContextMenuTrigger = styled(Menu.Trigger)`
  :hover,
  :focus {
    background-color: ${({ theme })=>theme.colors.neutral100};
  }

  > span {
    font-size: 0;
  }
`;
const InputRenderer = (props)=>{
    switch(props.type){
        case 'color':
            return /*#__PURE__*/ jsx(ColorSelector, {
                ...props
            });
        case 'permissions':
            return /*#__PURE__*/ jsx(PermissionsField, {
                ...props
            });
        default:
            return /*#__PURE__*/ jsx(InputRenderer$1, {
                ...props
            });
    }
};
const ColorSelector = ({ disabled, label, name, required })=>{
    const { formatMessage } = useIntl();
    const { value, error, onChange } = useField(name);
    const colorOptions = AVAILABLE_COLORS.map(({ hex, name })=>({
            value: hex,
            label: formatMessage({
                id: 'Settings.review-workflows.stage.color.name',
                defaultMessage: '{name}'
            }, {
                name
            }),
            color: hex
        }));
    const { themeColorName } = getStageColorByHex(value) ?? {};
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: error,
        name: name,
        required: required,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsx(SingleSelect, {
                disabled: disabled,
                onChange: (v)=>{
                    onChange(name, v.toString());
                },
                value: value?.toUpperCase(),
                startIcon: /*#__PURE__*/ jsx(Flex, {
                    tag: "span",
                    height: 2,
                    background: value,
                    borderColor: themeColorName === 'neutral0' ? 'neutral150' : 'transparent',
                    hasRadius: true,
                    shrink: 0,
                    width: 2
                }),
                children: colorOptions.map(({ value, label, color })=>{
                    const { themeColorName } = getStageColorByHex(color) || {};
                    return /*#__PURE__*/ jsx(SingleSelectOption, {
                        value: value,
                        startIcon: /*#__PURE__*/ jsx(Flex, {
                            tag: "span",
                            height: 2,
                            background: color,
                            borderColor: themeColorName === 'neutral0' ? 'neutral150' : 'transparent',
                            hasRadius: true,
                            shrink: 0,
                            width: 2
                        }),
                        children: label
                    }, value);
                })
            }),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
};
const PermissionsField = ({ disabled, name, placeholder, required })=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const [isApplyAllConfirmationOpen, setIsApplyAllConfirmationOpen] = React.useState(false);
    const { value = [], error, onChange } = useField(name);
    const allStages = useForm('PermissionsField', (state)=>state.values.stages);
    const onFormValueChange = useForm('PermissionsField', (state)=>state.onChange);
    const rolesErrorCount = React.useRef(0);
    const { data: roles = [], isLoading, error: getRolesError } = useGetAdminRolesQuery();
    // Super admins always have permissions to do everything and therefore
    // there is no point for this role to show up in the role combobox
    const filteredRoles = roles?.filter((role)=>role.code !== 'strapi-super-admin') ?? [];
    React.useEffect(()=>{
        if (!isLoading && getRolesError && 'status' in getRolesError && getRolesError.status == 403 && rolesErrorCount.current === 0) {
            rolesErrorCount.current = 1;
            toggleNotification({
                blockTransition: true,
                type: 'danger',
                message: formatMessage({
                    id: 'review-workflows.stage.permissions.noPermissions.description',
                    defaultMessage: 'You don’t have the permission to see roles. Contact your administrator.'
                })
            });
        }
    }, [
        formatMessage,
        isLoading,
        roles,
        toggleNotification,
        getRolesError
    ]);
    if (!isLoading && filteredRoles.length === 0) {
        return /*#__PURE__*/ jsxs(Field.Root, {
            name: name,
            hint: formatMessage({
                id: 'Settings.review-workflows.stage.permissions.noPermissions.description',
                defaultMessage: 'You don’t have the permission to see roles'
            }),
            required: required,
            children: [
                /*#__PURE__*/ jsx(Field.Label, {
                    children: formatMessage({
                        id: 'Settings.review-workflows.stage.permissions.label',
                        defaultMessage: 'Roles that can change this stage'
                    })
                }),
                /*#__PURE__*/ jsx(TextInput, {
                    disabled: true,
                    placeholder: formatMessage({
                        id: 'components.NotAllowedInput.text',
                        defaultMessage: 'No permissions to see this field'
                    }),
                    startAction: /*#__PURE__*/ jsx(EyeStriked, {
                        fill: "neutral600"
                    }),
                    type: "text",
                    value: ""
                }),
                /*#__PURE__*/ jsx(Field.Hint, {})
            ]
        });
    }
    return /*#__PURE__*/ jsx(Fragment, {
        children: /*#__PURE__*/ jsxs(Flex, {
            alignItems: "flex-end",
            gap: 3,
            children: [
                /*#__PURE__*/ jsx(PermissionWrapper, {
                    grow: 1,
                    children: /*#__PURE__*/ jsxs(Field.Root, {
                        error: error,
                        name: name,
                        required: true,
                        children: [
                            /*#__PURE__*/ jsx(Field.Label, {
                                children: formatMessage({
                                    id: 'Settings.review-workflows.stage.permissions.label',
                                    defaultMessage: 'Roles that can change this stage'
                                })
                            }),
                            /*#__PURE__*/ jsx(MultiSelect, {
                                disabled: disabled,
                                onChange: (values)=>{
                                    // Because the select components expects strings for values, but
                                    // the yup schema validates we are sending full permission objects to the API,
                                    // we must coerce the string value back to an object
                                    const permissions = values.map((value)=>({
                                            role: parseInt(value, 10),
                                            action: 'admin::review-workflows.stage.transition'
                                        }));
                                    onChange(name, permissions);
                                },
                                placeholder: placeholder,
                                // The Select component expects strings for values
                                value: value.map((permission)=>`${permission.role}`),
                                withTags: true,
                                children: /*#__PURE__*/ jsx(MultiSelectGroup, {
                                    label: formatMessage({
                                        id: 'Settings.review-workflows.stage.permissions.allRoles.label',
                                        defaultMessage: 'All roles'
                                    }),
                                    values: filteredRoles.map((r)=>`${r.id}`),
                                    children: filteredRoles.map((role)=>{
                                        return /*#__PURE__*/ jsx(NestedOption, {
                                            value: `${role.id}`,
                                            children: role.name
                                        }, role.id);
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(Field.Error, {})
                        ]
                    })
                }),
                /*#__PURE__*/ jsxs(Dialog.Root, {
                    open: isApplyAllConfirmationOpen,
                    onOpenChange: setIsApplyAllConfirmationOpen,
                    children: [
                        /*#__PURE__*/ jsx(Dialog.Trigger, {
                            children: /*#__PURE__*/ jsx(IconButton, {
                                disabled: disabled,
                                label: formatMessage({
                                    id: 'Settings.review-workflows.stage.permissions.apply.label',
                                    defaultMessage: 'Apply to all stages'
                                }),
                                size: "L",
                                children: /*#__PURE__*/ jsx(Duplicate, {})
                            })
                        }),
                        /*#__PURE__*/ jsx(ConfirmDialog, {
                            onConfirm: ()=>{
                                onFormValueChange('stages', allStages.map((stage)=>({
                                        ...stage,
                                        permissions: value
                                    })));
                                setIsApplyAllConfirmationOpen(false);
                                toggleNotification({
                                    type: 'success',
                                    message: formatMessage({
                                        id: 'Settings.review-workflows.page.edit.confirm.stages.permissions.copy.success',
                                        defaultMessage: 'Applied roles to all other stages of the workflow'
                                    })
                                });
                            },
                            variant: "default",
                            children: formatMessage({
                                id: 'Settings.review-workflows.page.edit.confirm.stages.permissions.copy',
                                defaultMessage: 'Roles that can change that stage will be applied to all the other stages.'
                            })
                        })
                    ]
                })
            ]
        })
    });
};
const NestedOption = styled(MultiSelectOption)`
  padding-left: ${({ theme })=>theme.spaces[7]};
`;
// Grow the size of the permission Select
const PermissionWrapper = styled(Flex)`
  > * {
    flex-grow: 1;
  }
`;

export { Stages };
//# sourceMappingURL=Stages.mjs.map
