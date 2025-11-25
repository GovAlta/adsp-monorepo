import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking, useNotification } from '@strapi/admin/strapi-admin';
import { Modal, Flex, Loader, Grid, Field, Typography, Button } from '@strapi/design-system';
import { Formik, Form } from 'formik';
import isEmpty from 'lodash/isEmpty';
import { useIntl } from 'react-intl';
import * as yup from 'yup';
import { useBulkRemove } from '../../hooks/useBulkRemove.mjs';
import { useEditFolder } from '../../hooks/useEditFolder.mjs';
import { useFolderStructure } from '../../hooks/useFolderStructure.mjs';
import { useMediaLibraryPermissions } from '../../hooks/useMediaLibraryPermissions.mjs';
import { findRecursiveFolderByValue } from '../../utils/findRecursiveFolderByValue.mjs';
import 'byte-size';
import 'date-fns';
import { getAPIInnerErrors } from '../../utils/getAPIInnerErrors.mjs';
import { getTrad } from '../../utils/getTrad.mjs';
import 'qs';
import '../../constants.mjs';
import '../../utils/urlYupSchema.mjs';
import { ContextInfo } from '../ContextInfo/ContextInfo.mjs';
import { SelectTree } from '../SelectTree/SelectTree.mjs';
import { EditFolderModalHeader } from './ModalHeader/ModalHeader.mjs';
import { RemoveFolderDialog } from './RemoveFolderDialog.mjs';

const folderSchema = yup.object({
    name: yup.string().required(),
    parent: yup.object({
        label: yup.string(),
        value: yup.number().nullable(true)
    }).nullable(true)
});
const EditFolderContent = ({ onClose, folder, location, parentFolderId })=>{
    const { data: folderStructure, isLoading: folderStructureIsLoading } = useFolderStructure({
        enabled: true
    });
    const { canCreate, isLoading: isLoadingPermissions, canUpdate } = useMediaLibraryPermissions();
    const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
    const { formatMessage, formatDate } = useIntl();
    const { trackUsage } = useTracking();
    const { editFolder, isLoading: isEditFolderLoading } = useEditFolder();
    const { remove } = useBulkRemove();
    const { toggleNotification } = useNotification();
    const isLoading = isLoadingPermissions || folderStructureIsLoading;
    const isEditing = !!folder;
    const formDisabled = folder && !canUpdate || !folder && !canCreate;
    const initialFormData = !folderStructureIsLoading ? {
        name: folder?.name ?? '',
        parent: {
            /* ideally we would use folderStructure[0].value, but since it is null
         react complains about rendering null as field value */ value: parentFolderId ? parseInt(parentFolderId.toString(), 10) : undefined,
            label: parentFolderId ? folderStructure && findRecursiveFolderByValue(folderStructure, parseInt(parentFolderId.toString(), 10))?.label : folderStructure?.[0].label
        }
    } : {
        name: '',
        parent: null
    };
    const formRef = React.useRef(null);
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
                    id: getTrad('modal.folder-notification-edited-success'),
                    defaultMessage: 'Folder successfully edited'
                }) : formatMessage({
                    id: getTrad('modal.folder-notification-created-success'),
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
            const errors = getAPIInnerErrors(err, {
                getTrad
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
        return /*#__PURE__*/ jsxs(Fragment, {
            children: [
                /*#__PURE__*/ jsx(EditFolderModalHeader, {
                    isEditing: isEditing
                }),
                /*#__PURE__*/ jsx(Modal.Body, {
                    children: /*#__PURE__*/ jsx(Flex, {
                        justifyContent: "center",
                        paddingTop: 4,
                        paddingBottom: 4,
                        children: /*#__PURE__*/ jsx(Loader, {
                            children: formatMessage({
                                id: getTrad('content.isLoading'),
                                defaultMessage: 'Content is loading.'
                            })
                        })
                    })
                })
            ]
        });
    }
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Formik, {
                validationSchema: folderSchema,
                validateOnChange: false,
                onSubmit: handleSubmit,
                initialValues: initialFormData,
                children: ({ values, errors, handleChange, setFieldValue, handleSubmit })=>/*#__PURE__*/ jsxs(Form, {
                        noValidate: true,
                        ref: formRef,
                        onKeyDown: handleKeyDown(handleSubmit),
                        children: [
                            /*#__PURE__*/ jsx(EditFolderModalHeader, {
                                isEditing: isEditing
                            }),
                            /*#__PURE__*/ jsx(Modal.Body, {
                                children: /*#__PURE__*/ jsxs(Grid.Root, {
                                    gap: 4,
                                    children: [
                                        isEditing && /*#__PURE__*/ jsx(Grid.Item, {
                                            xs: 12,
                                            col: 12,
                                            direction: "column",
                                            alignItems: "stretch",
                                            children: /*#__PURE__*/ jsx(ContextInfo, {
                                                blocks: [
                                                    {
                                                        label: formatMessage({
                                                            id: getTrad('modal.folder.create.elements'),
                                                            defaultMessage: 'Elements'
                                                        }),
                                                        value: formatMessage({
                                                            id: getTrad('modal.folder.elements.count'),
                                                            defaultMessage: '{folderCount} folders, {assetCount} assets'
                                                        }, {
                                                            assetCount: folder?.files?.count ?? 0,
                                                            folderCount: folder?.children?.count ?? 0
                                                        })
                                                    },
                                                    {
                                                        label: formatMessage({
                                                            id: getTrad('modal.folder.create.creation-date'),
                                                            defaultMessage: 'Creation Date'
                                                        }),
                                                        value: formatDate(new Date(folder.createdAt))
                                                    }
                                                ]
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Grid.Item, {
                                            xs: 12,
                                            col: 6,
                                            direction: "column",
                                            alignItems: "stretch",
                                            children: /*#__PURE__*/ jsxs(Field.Root, {
                                                name: "name",
                                                error: typeof errors.name === 'string' ? errors.name : undefined,
                                                children: [
                                                    /*#__PURE__*/ jsx(Field.Label, {
                                                        children: formatMessage({
                                                            id: getTrad('form.input.label.folder-name'),
                                                            defaultMessage: 'Name'
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsx(Field.Input, {
                                                        value: values.name,
                                                        onChange: handleChange,
                                                        disabled: formDisabled
                                                    }),
                                                    /*#__PURE__*/ jsx(Field.Error, {})
                                                ]
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Grid.Item, {
                                            xs: 12,
                                            col: 6,
                                            direction: "column",
                                            alignItems: "stretch",
                                            children: /*#__PURE__*/ jsxs(Field.Root, {
                                                id: "folder-parent",
                                                children: [
                                                    /*#__PURE__*/ jsx(Field.Label, {
                                                        children: formatMessage({
                                                            id: getTrad('form.input.label.folder-location'),
                                                            defaultMessage: 'Location'
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsx(SelectTree, {
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
                                                    errors.parent && /*#__PURE__*/ jsx(Typography, {
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
                            /*#__PURE__*/ jsxs(Modal.Footer, {
                                children: [
                                    /*#__PURE__*/ jsx(Button, {
                                        onClick: ()=>onClose(),
                                        variant: "tertiary",
                                        name: "cancel",
                                        children: formatMessage({
                                            id: 'cancel',
                                            defaultMessage: 'Cancel'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxs(Flex, {
                                        gap: 2,
                                        children: [
                                            isEditing && canUpdate && /*#__PURE__*/ jsx(Button, {
                                                type: "button",
                                                variant: "danger-light",
                                                onClick: ()=>setShowConfirmDialog(true),
                                                name: "delete",
                                                disabled: !canUpdate || isEditFolderLoading,
                                                children: formatMessage({
                                                    id: getTrad('modal.folder.create.delete'),
                                                    defaultMessage: 'Delete folder'
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Button, {
                                                name: "submit",
                                                loading: isEditFolderLoading,
                                                disabled: formDisabled,
                                                type: "submit",
                                                children: formatMessage(isEditing ? {
                                                    id: getTrad('modal.folder.edit.submit'),
                                                    defaultMessage: 'Save'
                                                } : {
                                                    id: getTrad('modal.folder.create.submit'),
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
            /*#__PURE__*/ jsx(RemoveFolderDialog, {
                open: showConfirmDialog,
                onClose: ()=>setShowConfirmDialog(false),
                onConfirm: handleDelete
            })
        ]
    });
};
const EditFolderDialog = ({ open, onClose, ...restProps })=>{
    return /*#__PURE__*/ jsx(Modal.Root, {
        open: open,
        onOpenChange: onClose,
        children: /*#__PURE__*/ jsx(Modal.Content, {
            children: /*#__PURE__*/ jsx(EditFolderContent, {
                ...restProps,
                onClose: onClose,
                open: open
            })
        })
    });
};

export { EditFolderContent, EditFolderDialog };
//# sourceMappingURL=EditFolderDialog.mjs.map
