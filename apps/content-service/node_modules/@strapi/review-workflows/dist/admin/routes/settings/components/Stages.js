'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactDndHtml5Backend = require('react-dnd-html5-backend');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var admin = require('../../../services/admin.js');
var colors = require('../../../utils/colors.js');
var constants = require('../constants.js');
var useDragAndDrop = require('../hooks/useDragAndDrop.js');
var AddStage = require('./AddStage.js');

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

const Stages = ({ canDelete = true, canUpdate = true, isCreating })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = strapiAdmin.useTracking();
    const addFieldRow = strapiAdmin.useForm('Stages', (state)=>state.addFieldRow);
    const { value: stages = [] } = strapiAdmin.useField('stages');
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        gap: 6,
        width: "100%",
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                position: "relative",
                width: "100%",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(Background, {
                        background: "neutral200",
                        height: "100%",
                        left: "50%",
                        position: "absolute",
                        top: "0",
                        width: 2
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 6,
                        position: "relative",
                        tag: "ol",
                        children: stages.map((stage, index)=>{
                            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                tag: "li",
                                children: /*#__PURE__*/ jsxRuntime.jsx(Stage, {
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
            canUpdate && /*#__PURE__*/ jsxRuntime.jsx(AddStage.AddStage, {
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
const Background = styledComponents.styled(designSystem.Box)`
  transform: translateX(-50%);
`;
const Stage = ({ index, canDelete = false, canReorder = false, canUpdate = false, stagesCount, name, permissions, color, defaultOpen })=>{
    const [liveText, setLiveText] = React__namespace.useState();
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = strapiAdmin.useTracking();
    const stageErrors = strapiAdmin.useForm('Stages', (state)=>state.errors.stages);
    const error = stageErrors?.[index];
    const addFieldRow = strapiAdmin.useForm('Stage', (state)=>state.addFieldRow);
    const moveFieldRow = strapiAdmin.useForm('Stage', (state)=>state.moveFieldRow);
    const removeFieldRow = strapiAdmin.useForm('Stage', (state)=>state.removeFieldRow);
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
    const [{ handlerId, isDragging, handleKeyDown }, stageRef, dropRef, dragRef, dragPreviewRef] = useDragAndDrop.useDragAndDrop(canReorder, {
        index,
        item: {
            index,
            name
        },
        onGrabItem: handleGrabStage,
        onDropItem: handleDropStage,
        onMoveItem: handleMoveStage,
        onCancel: handleCancelDragStage,
        type: constants.DRAG_DROP_TYPES.STAGE
    });
    // @ts-expect-error – the stageRef is incorrectly typed.
    const composedRef = designSystem.useComposedRefs(stageRef, dropRef);
    React__namespace.useEffect(()=>{
        dragPreviewRef(reactDndHtml5Backend.getEmptyImage(), {
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
    const id = React__namespace.useId();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
        ref: composedRef,
        shadow: "tableShadow",
        children: [
            liveText && /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                "aria-live": "assertive",
                children: liveText
            }),
            isDragging ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                background: "primary100",
                borderStyle: "dashed",
                borderColor: "primary600",
                borderWidth: "1px",
                display: "block",
                hasRadius: true,
                padding: 6
            }) : /*#__PURE__*/ jsxRuntime.jsx(AccordionRoot, {
                onValueChange: (value)=>{
                    if (value) {
                        trackUsage('willEditStage');
                    }
                },
                defaultValue: defaultOpen ? id : undefined,
                $error: Object.values(error ?? {}).length > 0,
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Accordion.Item, {
                    value: id,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Accordion.Header, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Trigger, {
                                    children: name
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Actions, {
                                    children: canDelete || canUpdate ? /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Root, {
                                                children: [
                                                    /*#__PURE__*/ jsxRuntime.jsxs(ContextMenuTrigger, {
                                                        size: "S",
                                                        endIcon: null,
                                                        paddingLeft: 2,
                                                        paddingRight: 2,
                                                        children: [
                                                            /*#__PURE__*/ jsxRuntime.jsx(icons.More, {
                                                                "aria-hidden": true,
                                                                focusable: false
                                                            }),
                                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                                                                tag: "span",
                                                                children: formatMessage({
                                                                    id: '[tbdb].components.DynamicZone.more-actions',
                                                                    defaultMessage: 'More actions'
                                                                })
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Content, {
                                                        popoverPlacement: "bottom-end",
                                                        zIndex: 2,
                                                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.SubRoot, {
                                                            children: [
                                                                canUpdate && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                                                                    onClick: handleCloneClick,
                                                                    children: formatMessage({
                                                                        id: 'Settings.review-workflows.stage.delete',
                                                                        defaultMessage: 'Duplicate stage'
                                                                    })
                                                                }),
                                                                canDelete && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
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
                                            canUpdate && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
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
                                                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Drag, {})
                                            })
                                        ]
                                    }) : null
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Content, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
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
                                ].map(({ size, ...field })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                        col: size,
                                        direction: "column",
                                        alignItems: "stretch",
                                        children: /*#__PURE__*/ jsxRuntime.jsx(InputRenderer, {
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
const AccordionRoot = styledComponents.styled(designSystem.Accordion.Root)`
  border: 1px solid
    ${({ theme, $error })=>$error ? theme.colors.danger600 : theme.colors.neutral200};
`;
// Removing the font-size from the child-span aligns the
// more icon vertically
const ContextMenuTrigger = styledComponents.styled(designSystem.Menu.Trigger)`
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
            return /*#__PURE__*/ jsxRuntime.jsx(ColorSelector, {
                ...props
            });
        case 'permissions':
            return /*#__PURE__*/ jsxRuntime.jsx(PermissionsField, {
                ...props
            });
        default:
            return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.InputRenderer, {
                ...props
            });
    }
};
const ColorSelector = ({ disabled, label, name, required })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { value, error, onChange } = strapiAdmin.useField(name);
    const colorOptions = colors.AVAILABLE_COLORS.map(({ hex, name })=>({
            value: hex,
            label: formatMessage({
                id: 'Settings.review-workflows.stage.color.name',
                defaultMessage: '{name}'
            }, {
                name
            }),
            color: hex
        }));
    const { themeColorName } = colors.getStageColorByHex(value) ?? {};
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: error,
        name: name,
        required: required,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                disabled: disabled,
                onChange: (v)=>{
                    onChange(name, v.toString());
                },
                value: value?.toUpperCase(),
                startIcon: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                    tag: "span",
                    height: 2,
                    background: value,
                    borderColor: themeColorName === 'neutral0' ? 'neutral150' : 'transparent',
                    hasRadius: true,
                    shrink: 0,
                    width: 2
                }),
                children: colorOptions.map(({ value, label, color })=>{
                    const { themeColorName } = colors.getStageColorByHex(color) || {};
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                        value: value,
                        startIcon: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
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
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
};
const PermissionsField = ({ disabled, name, placeholder, required })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const [isApplyAllConfirmationOpen, setIsApplyAllConfirmationOpen] = React__namespace.useState(false);
    const { value = [], error, onChange } = strapiAdmin.useField(name);
    const allStages = strapiAdmin.useForm('PermissionsField', (state)=>state.values.stages);
    const onFormValueChange = strapiAdmin.useForm('PermissionsField', (state)=>state.onChange);
    const rolesErrorCount = React__namespace.useRef(0);
    const { data: roles = [], isLoading, error: getRolesError } = admin.useGetAdminRolesQuery();
    // Super admins always have permissions to do everything and therefore
    // there is no point for this role to show up in the role combobox
    const filteredRoles = roles?.filter((role)=>role.code !== 'strapi-super-admin') ?? [];
    React__namespace.useEffect(()=>{
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
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
            name: name,
            hint: formatMessage({
                id: 'Settings.review-workflows.stage.permissions.noPermissions.description',
                defaultMessage: 'You don’t have the permission to see roles'
            }),
            required: required,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                    children: formatMessage({
                        id: 'Settings.review-workflows.stage.permissions.label',
                        defaultMessage: 'Roles that can change this stage'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                    disabled: true,
                    placeholder: formatMessage({
                        id: 'components.NotAllowedInput.text',
                        defaultMessage: 'No permissions to see this field'
                    }),
                    startAction: /*#__PURE__*/ jsxRuntime.jsx(icons.EyeStriked, {
                        fill: "neutral600"
                    }),
                    type: "text",
                    value: ""
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {})
            ]
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            alignItems: "flex-end",
            gap: 3,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(PermissionWrapper, {
                    grow: 1,
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                        error: error,
                        name: name,
                        required: true,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                children: formatMessage({
                                    id: 'Settings.review-workflows.stage.permissions.label',
                                    defaultMessage: 'Roles that can change this stage'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.MultiSelect, {
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
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.MultiSelectGroup, {
                                    label: formatMessage({
                                        id: 'Settings.review-workflows.stage.permissions.allRoles.label',
                                        defaultMessage: 'All roles'
                                    }),
                                    values: filteredRoles.map((r)=>`${r.id}`),
                                    children: filteredRoles.map((role)=>{
                                        return /*#__PURE__*/ jsxRuntime.jsx(NestedOption, {
                                            value: `${role.id}`,
                                            children: role.name
                                        }, role.id);
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                        ]
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Root, {
                    open: isApplyAllConfirmationOpen,
                    onOpenChange: setIsApplyAllConfirmationOpen,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Trigger, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                disabled: disabled,
                                label: formatMessage({
                                    id: 'Settings.review-workflows.stage.permissions.apply.label',
                                    defaultMessage: 'Apply to all stages'
                                }),
                                size: "L",
                                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Duplicate, {})
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
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
const NestedOption = styledComponents.styled(designSystem.MultiSelectOption)`
  padding-left: ${({ theme })=>theme.spaces[7]};
`;
// Grow the size of the permission Select
const PermissionWrapper = styledComponents.styled(designSystem.Flex)`
  > * {
    flex-grow: 1;
  }
`;

exports.Stages = Stages;
//# sourceMappingURL=Stages.js.map
