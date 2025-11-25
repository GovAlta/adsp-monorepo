'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var formik = require('formik');
var isEmpty = require('lodash/isEmpty');
var reactIntl = require('react-intl');
var yup = require('yup');
var useBulkRemove = require('../../hooks/useBulkRemove.js');
var useEditFolder = require('../../hooks/useEditFolder.js');
var useFolderStructure = require('../../hooks/useFolderStructure.js');
var useMediaLibraryPermissions = require('../../hooks/useMediaLibraryPermissions.js');
var findRecursiveFolderByValue = require('../../utils/findRecursiveFolderByValue.js');
require('byte-size');
require('date-fns');
var getAPIInnerErrors = require('../../utils/getAPIInnerErrors.js');
var getTrad = require('../../utils/getTrad.js');
require('qs');
require('../../constants.js');
require('../../utils/urlYupSchema.js');
var ContextInfo = require('../ContextInfo/ContextInfo.js');
var SelectTree = require('../SelectTree/SelectTree.js');
var ModalHeader = require('./ModalHeader/ModalHeader.js');
var RemoveFolderDialog = require('./RemoveFolderDialog.js');

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
var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

const folderSchema = yup__namespace.object({
    name: yup__namespace.string().required(),
    parent: yup__namespace.object({
        label: yup__namespace.string(),
        value: yup__namespace.number().nullable(true)
    }).nullable(true)
});
const EditFolderContent = ({ onClose, folder, location, parentFolderId })=>{
    const { data: folderStructure, isLoading: folderStructureIsLoading } = useFolderStructure.useFolderStructure({
        enabled: true
    });
    const { canCreate, isLoading: isLoadingPermissions, canUpdate } = useMediaLibraryPermissions.useMediaLibraryPermissions();
    const [showConfirmDialog, setShowConfirmDialog] = React__namespace.useState(false);
    const { formatMessage, formatDate } = reactIntl.useIntl();
    const { trackUsage } = strapiAdmin.useTracking();
    const { editFolder, isLoading: isEditFolderLoading } = useEditFolder.useEditFolder();
    const { remove } = useBulkRemove.useBulkRemove();
    const { toggleNotification } = strapiAdmin.useNotification();
    const isLoading = isLoadingPermissions || folderStructureIsLoading;
    const isEditing = !!folder;
    const formDisabled = folder && !canUpdate || !folder && !canCreate;
    const initialFormData = !folderStructureIsLoading ? {
        name: folder?.name ?? '',
        parent: {
            /* ideally we would use folderStructure[0].value, but since it is null
         react complains about rendering null as field value */ value: parentFolderId ? parseInt(parentFolderId.toString(), 10) : undefined,
            label: parentFolderId ? folderStructure && findRecursiveFolderByValue.findRecursiveFolderByValue(folderStructure, parseInt(parentFolderId.toString(), 10))?.label : folderStructure?.[0].label
        }
    } : {
        name: '',
        parent: null
    };
    const formRef = React__namespace.useRef(null);
    const handleKeyDown = (handleSubmit)=>(event)=>{
            if (event.key === 'Enter') {
                if (event.target instanceof HTMLInputElement) {
                    handleSubmit(event);
                    event.preventDefault();
                }
            }
        };
    const handleSubmit = async (values, { setErrors })=>{
        try {
            await editFolder({
                ...values,
                parent: values.parent?.value ?? null
            }, folder?.id);
            toggleNotification({
                type: 'success',
                message: isEditing ? formatMessage({
                    id: getTrad.getTrad('modal.folder-notification-edited-success'),
                    defaultMessage: 'Folder successfully edited'
                }) : formatMessage({
                    id: getTrad.getTrad('modal.folder-notification-created-success'),
                    defaultMessage: 'Folder successfully created'
                })
            });
            if (isEditing) {
                const didChangeLocation = parentFolderId ? parseInt(parentFolderId.toString(), 10) !== values.parent?.value : parentFolderId === null && !!values.parent?.value;
                trackUsage('didEditMediaLibraryElements', {
                    location,
                    type: 'folder',
                    changeLocation: didChangeLocation
                });
            } else {
                trackUsage('didAddMediaLibraryFolders', {
                    location: location
                });
            }
            onClose({
                created: true
            });
        } catch (err) {
            const errors = getAPIInnerErrors.getAPIInnerErrors(err, {
                getTrad: getTrad.getTrad
            });
            const formikErrors = Object.entries(errors).reduce((acc, [key, error])=>{
                acc[key] = error.defaultMessage;
                return acc;
            }, {});
            if (!isEmpty(formikErrors)) {
                setErrors(formikErrors);
            }
        }
    };
    const handleDelete = async ()=>{
        if (folder) {
            await remove([
                folder
            ]);
        }
        setShowConfirmDialog(false);
        onClose();
    };
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(ModalHeader.EditFolderModalHeader, {
                    isEditing: isEditing
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        justifyContent: "center",
                        paddingTop: 4,
                        paddingBottom: 4,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Loader, {
                            children: formatMessage({
                                id: getTrad.getTrad('content.isLoading'),
                                defaultMessage: 'Content is loading.'
                            })
                        })
                    })
                })
            ]
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(formik.Formik, {
                validationSchema: folderSchema,
                validateOnChange: false,
                onSubmit: handleSubmit,
                initialValues: initialFormData,
                children: ({ values, errors, handleChange, setFieldValue, handleSubmit })=>/*#__PURE__*/ jsxRuntime.jsxs(formik.Form, {
                        noValidate: true,
                        ref: formRef,
                        onKeyDown: handleKeyDown(handleSubmit),
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(ModalHeader.EditFolderModalHeader, {
                                isEditing: isEditing
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
                                    gap: 4,
                                    children: [
                                        isEditing && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                            xs: 12,
                                            col: 12,
                                            direction: "column",
                                            alignItems: "stretch",
                                            children: /*#__PURE__*/ jsxRuntime.jsx(ContextInfo.ContextInfo, {
                                                blocks: [
                                                    {
                                                        label: formatMessage({
                                                            id: getTrad.getTrad('modal.folder.create.elements'),
                                                            defaultMessage: 'Elements'
                                                        }),
                                                        value: formatMessage({
                                                            id: getTrad.getTrad('modal.folder.elements.count'),
                                                            defaultMessage: '{folderCount} folders, {assetCount} assets'
                                                        }, {
                                                            assetCount: folder?.files?.count ?? 0,
                                                            folderCount: folder?.children?.count ?? 0
                                                        })
                                                    },
                                                    {
                                                        label: formatMessage({
                                                            id: getTrad.getTrad('modal.folder.create.creation-date'),
                                                            defaultMessage: 'Creation Date'
                                                        }),
                                                        value: formatDate(new Date(folder.createdAt))
                                                    }
                                                ]
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                            xs: 12,
                                            col: 6,
                                            direction: "column",
                                            alignItems: "stretch",
                                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                                                name: "name",
                                                error: typeof errors.name === 'string' ? errors.name : undefined,
                                                children: [
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                                        children: formatMessage({
                                                            id: getTrad.getTrad('form.input.label.folder-name'),
                                                            defaultMessage: 'Name'
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Input, {
                                                        value: values.name,
                                                        onChange: handleChange,
                                                        disabled: formDisabled
                                                    }),
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                                                ]
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                            xs: 12,
                                            col: 6,
                                            direction: "column",
                                            alignItems: "stretch",
                                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                                                id: "folder-parent",
                                                children: [
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                                        children: formatMessage({
                                                            id: getTrad.getTrad('form.input.label.folder-location'),
                                                            defaultMessage: 'Location'
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsxRuntime.jsx(SelectTree.SelectTree, {
                                                        options: folderStructure,
                                                        onChange: (value)=>{
                                                            setFieldValue('parent', value);
                                                        },
                                                        isDisabled: formDisabled,
                                                        defaultValue: values.parent,
                                                        name: "parent",
                                                        menuPortalTarget: document.querySelector('body'),
                                                        inputId: "folder-parent",
                                                        disabled: formDisabled,
                                                        error: typeof errors.parent === 'string' ? errors.parent : undefined,
                                                        ariaErrorMessage: "folder-parent-error"
                                                    }),
                                                    errors.parent && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                        variant: "pi",
                                                        tag: "p",
                                                        id: "folder-parent-error",
                                                        textColor: "danger600",
                                                        children: typeof errors.parent === 'string' ? errors.parent : undefined
                                                    })
                                                ]
                                            })
                                        })
                                    ]
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        onClick: ()=>onClose(),
                                        variant: "tertiary",
                                        name: "cancel",
                                        children: formatMessage({
                                            id: 'cancel',
                                            defaultMessage: 'Cancel'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        gap: 2,
                                        children: [
                                            isEditing && canUpdate && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                                type: "button",
                                                variant: "danger-light",
                                                onClick: ()=>setShowConfirmDialog(true),
                                                name: "delete",
                                                disabled: !canUpdate || isEditFolderLoading,
                                                children: formatMessage({
                                                    id: getTrad.getTrad('modal.folder.create.delete'),
                                                    defaultMessage: 'Delete folder'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                                name: "submit",
                                                loading: isEditFolderLoading,
                                                disabled: formDisabled,
                                                type: "submit",
                                                children: formatMessage(isEditing ? {
                                                    id: getTrad.getTrad('modal.folder.edit.submit'),
                                                    defaultMessage: 'Save'
                                                } : {
                                                    id: getTrad.getTrad('modal.folder.create.submit'),
                                                    defaultMessage: 'Create'
                                                })
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(RemoveFolderDialog.RemoveFolderDialog, {
                open: showConfirmDialog,
                onClose: ()=>setShowConfirmDialog(false),
                onConfirm: handleDelete
            })
        ]
    });
};
const EditFolderDialog = ({ open, onClose, ...restProps })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Root, {
        open: open,
        onOpenChange: onClose,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Content, {
            children: /*#__PURE__*/ jsxRuntime.jsx(EditFolderContent, {
                ...restProps,
                onClose: onClose,
                open: open
            })
        })
    });
};

exports.EditFolderContent = EditFolderContent;
exports.EditFolderDialog = EditFolderDialog;
//# sourceMappingURL=EditFolderDialog.js.map
