import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { useRBAC, useNotification, useAPIErrorHandler, useQueryParams, isFetchError } from '@strapi/admin/strapi-admin';
import { unstable_useDocumentLayout } from '@strapi/content-manager/strapi-admin';
import { Modal, Button, EmptyStateLayout, LinkButton, Flex, Box, Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { PaperPlane } from '@strapi/icons';
import { EmptyDocuments } from '@strapi/icons/symbols';
import { useFormik } from 'formik';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import * as yup from 'yup';
import { PERMISSIONS } from '../constants.mjs';
import { useCreateReleaseActionMutation, useGetReleasesForEntryQuery } from '../services/release.mjs';
import { ReleaseActionOptions } from './ReleaseActionOptions.mjs';

/* -------------------------------------------------------------------------------------------------
 * AddActionToReleaseModal
 * -----------------------------------------------------------------------------------------------*/ const RELEASE_ACTION_FORM_SCHEMA = yup.object().shape({
    type: yup.string().oneOf([
        'publish',
        'unpublish'
    ]).required(),
    releaseId: yup.string().required()
});
const INITIAL_VALUES = {
    type: 'publish',
    releaseId: ''
};
const NoReleases = ()=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(EmptyStateLayout, {
        icon: /*#__PURE__*/ jsx(EmptyDocuments, {
            width: "16rem"
        }),
        content: formatMessage({
            id: 'content-releases.content-manager-edit-view.add-to-release.no-releases-message',
            defaultMessage: 'No available releases. Open the list of releases and create a new one from there.'
        }),
        action: /*#__PURE__*/ jsx(LinkButton, {
            to: {
                pathname: '/plugins/content-releases'
            },
            tag: Link,
            variant: "secondary",
            children: formatMessage({
                id: 'content-releases.content-manager-edit-view.add-to-release.redirect-button',
                defaultMessage: 'Open the list of releases'
            })
        }),
        shadow: "none"
    });
};
const AddActionToReleaseModal = ({ contentType, documentId, onInputChange, values })=>{
    const { formatMessage } = useIntl();
    const [{ query }] = useQueryParams();
    const locale = query.plugins?.i18n?.locale;
    // Get all 'pending' releases that do not have the entry attached
    const response = useGetReleasesForEntryQuery({
        contentType,
        entryDocumentId: documentId,
        hasEntryAttached: false,
        locale
    });
    const releases = response.data?.data;
    if (releases?.length === 0) {
        return /*#__PURE__*/ jsx(NoReleases, {});
    }
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 2,
        children: [
            /*#__PURE__*/ jsx(Box, {
                paddingBottom: 6,
                children: /*#__PURE__*/ jsxs(Field.Root, {
                    required: true,
                    children: [
                        /*#__PURE__*/ jsx(Field.Label, {
                            children: formatMessage({
                                id: 'content-releases.content-manager-edit-view.add-to-release.select-label',
                                defaultMessage: 'Select a release'
                            })
                        }),
                        /*#__PURE__*/ jsx(SingleSelect, {
                            required: true,
                            placeholder: formatMessage({
                                id: 'content-releases.content-manager-edit-view.add-to-release.select-placeholder',
                                defaultMessage: 'Select'
                            }),
                            name: "releaseId",
                            onChange: (value)=>onInputChange('releaseId', value),
                            value: values.releaseId,
                            children: releases?.map((release)=>/*#__PURE__*/ jsx(SingleSelectOption, {
                                    value: release.id,
                                    children: release.name
                                }, release.id))
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsx(Field.Label, {
                children: formatMessage({
                    id: 'content-releases.content-manager-edit-view.add-to-release.action-type-label',
                    defaultMessage: 'What do you want to do with this entry?'
                })
            }),
            /*#__PURE__*/ jsx(ReleaseActionOptions, {
                selected: values.type,
                handleChange: (e)=>onInputChange('type', e.target.value),
                name: "type"
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * ReleaseActionModalForm
 * -----------------------------------------------------------------------------------------------*/ const ReleaseActionModalForm = ({ documentId, document, model, collectionType })=>{
    const { formatMessage } = useIntl();
    const { allowedActions } = useRBAC(PERMISSIONS);
    const { canCreateAction } = allowedActions;
    const [createReleaseAction, { isLoading }] = useCreateReleaseActionMutation();
    const { toggleNotification } = useNotification();
    const { formatAPIError } = useAPIErrorHandler();
    const [{ query }] = useQueryParams();
    const locale = query.plugins?.i18n?.locale;
    const handleSubmit = async (e, onClose)=>{
        try {
            await formik.handleSubmit(e);
            onClose();
        } catch (error) {
            if (isFetchError(error)) {
                // Handle axios error
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(error)
                });
            } else {
                // Handle generic error
                toggleNotification({
                    type: 'danger',
                    message: formatMessage({
                        id: 'notification.error',
                        defaultMessage: 'An error occurred'
                    })
                });
            }
        }
    };
    const formik = useFormik({
        initialValues: INITIAL_VALUES,
        validationSchema: RELEASE_ACTION_FORM_SCHEMA,
        onSubmit: async (values)=>{
            if (collectionType === 'collection-types' && !documentId) {
                throw new Error('Document id is required');
            }
            const response = await createReleaseAction({
                body: {
                    type: values.type,
                    contentType: model,
                    entryDocumentId: documentId,
                    locale
                },
                params: {
                    releaseId: values.releaseId
                }
            });
            if ('data' in response) {
                // Handle success
                toggleNotification({
                    type: 'success',
                    message: formatMessage({
                        id: 'content-releases.content-manager-edit-view.add-to-release.notification.success',
                        defaultMessage: 'Entry added to release'
                    })
                });
                return;
            }
            if ('error' in response) {
                throw response.error;
            }
        }
    });
    const { edit: { options } } = unstable_useDocumentLayout(model);
    // Project is not EE or contentType does not have draftAndPublish enabled
    if (!window.strapi.isEE || !options?.draftAndPublish || !canCreateAction) {
        return null;
    }
    if (collectionType === 'collection-types' && (!documentId || documentId === 'create')) {
        return null;
    }
    return {
        label: formatMessage({
            id: 'content-releases.content-manager-edit-view.add-to-release',
            defaultMessage: 'Add to release'
        }),
        icon: /*#__PURE__*/ jsx(PaperPlane, {}),
        // Entry is creating so we don't want to allow adding it to a release
        disabled: !document,
        position: [
            'panel',
            'table-row'
        ],
        dialog: {
            type: 'modal',
            title: formatMessage({
                id: 'content-releases.content-manager-edit-view.add-to-release',
                defaultMessage: 'Add to release'
            }),
            content: /*#__PURE__*/ jsx(AddActionToReleaseModal, {
                contentType: model,
                documentId: documentId,
                onInputChange: formik.setFieldValue,
                values: formik.values
            }),
            footer: ({ onClose })=>/*#__PURE__*/ jsxs(Modal.Footer, {
                    children: [
                        /*#__PURE__*/ jsx(Button, {
                            onClick: onClose,
                            variant: "tertiary",
                            name: "cancel",
                            children: formatMessage({
                                id: 'content-releases.content-manager-edit-view.add-to-release.cancel-button',
                                defaultMessage: 'Cancel'
                            })
                        }),
                        /*#__PURE__*/ jsx(Button, {
                            type: "submit",
                            // @ts-expect-error - formik ReactEvent types don't match button onClick types as they expect a MouseEvent
                            onClick: (e)=>handleSubmit(e, onClose),
                            disabled: !formik.values.releaseId,
                            loading: isLoading,
                            children: formatMessage({
                                id: 'content-releases.content-manager-edit-view.add-to-release.continue-button',
                                defaultMessage: 'Continue'
                            })
                        })
                    ]
                })
        }
    };
};

export { INITIAL_VALUES, NoReleases, RELEASE_ACTION_FORM_SCHEMA, ReleaseActionModalForm };
//# sourceMappingURL=ReleaseActionModal.mjs.map
