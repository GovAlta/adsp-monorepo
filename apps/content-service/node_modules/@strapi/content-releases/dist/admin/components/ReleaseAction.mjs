import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { useNotification, useAPIErrorHandler, useQueryParams, useRBAC, isFetchError } from '@strapi/admin/strapi-admin';
import { unstable_useContentManagerContext } from '@strapi/content-manager/strapi-admin';
import { Modal, Flex, Box, Field, SingleSelect, SingleSelectOption, Button } from '@strapi/design-system';
import { Formik, Form } from 'formik';
import { useIntl } from 'react-intl';
import { PERMISSIONS } from '../constants.mjs';
import { useGetReleasesQuery, useCreateManyReleaseActionsMutation } from '../services/release.mjs';
import { RELEASE_ACTION_FORM_SCHEMA, INITIAL_VALUES, NoReleases } from './ReleaseActionModal.mjs';
import { ReleaseActionOptions } from './ReleaseActionOptions.mjs';

const getContentPermissions = (subject)=>{
    const permissions = {
        publish: [
            {
                action: 'plugin::content-manager.explorer.publish',
                subject,
                id: '',
                actionParameters: {},
                properties: {},
                conditions: []
            }
        ]
    };
    return permissions;
};
const ReleaseAction = ({ documents, model })=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const { formatAPIError } = useAPIErrorHandler();
    const [{ query }] = useQueryParams();
    const contentPermissions = getContentPermissions(model);
    const { allowedActions: { canPublish } } = useRBAC(contentPermissions);
    const { allowedActions: { canCreate } } = useRBAC(PERMISSIONS);
    const { hasDraftAndPublish } = unstable_useContentManagerContext();
    // Get all the releases not published
    const response = useGetReleasesQuery();
    const releases = response.data?.data;
    const [createManyReleaseActions, { isLoading }] = useCreateManyReleaseActionsMutation();
    const documentIds = documents.map((doc)=>doc.documentId);
    const handleSubmit = async (values)=>{
        const locale = query.plugins?.i18n?.locale;
        const releaseActionEntries = documentIds.map((entryDocumentId)=>({
                type: values.type,
                contentType: model,
                entryDocumentId,
                locale
            }));
        const response = await createManyReleaseActions({
            body: releaseActionEntries,
            params: {
                releaseId: values.releaseId
            }
        });
        if ('data' in response) {
            // Handle success
            const notificationMessage = formatMessage({
                id: 'content-releases.content-manager-list-view.add-to-release.notification.success.message',
                defaultMessage: '{entriesAlreadyInRelease} out of {totalEntries} entries were already in the release.'
            }, {
                entriesAlreadyInRelease: response.data.meta.entriesAlreadyInRelease,
                totalEntries: response.data.meta.totalEntries
            });
            const notification = {
                type: 'success',
                title: formatMessage({
                    id: 'content-releases.content-manager-list-view.add-to-release.notification.success.title',
                    defaultMessage: 'Successfully added to release.'
                }, {
                    entriesAlreadyInRelease: response.data.meta.entriesAlreadyInRelease,
                    totalEntries: response.data.meta.totalEntries
                }),
                message: response.data.meta.entriesAlreadyInRelease ? notificationMessage : ''
            };
            toggleNotification(notification);
            return true;
        }
        if ('error' in response) {
            if (isFetchError(response.error)) {
                // Handle fetch error
                toggleNotification({
                    type: 'warning',
                    message: formatAPIError(response.error)
                });
            } else {
                // Handle generic error
                toggleNotification({
                    type: 'warning',
                    message: formatMessage({
                        id: 'notification.error',
                        defaultMessage: 'An error occurred'
                    })
                });
            }
        }
    };
    if (!hasDraftAndPublish || !canCreate || !canPublish) return null;
    return {
        actionType: 'release',
        variant: 'tertiary',
        label: formatMessage({
            id: 'content-manager-list-view.add-to-release',
            defaultMessage: 'Add to Release'
        }),
        dialog: {
            type: 'modal',
            title: formatMessage({
                id: 'content-manager-list-view.add-to-release',
                defaultMessage: 'Add to Release'
            }),
            content: ({ onClose })=>{
                return /*#__PURE__*/ jsx(Formik, {
                    onSubmit: async (values)=>{
                        const data = await handleSubmit(values);
                        if (data) {
                            return onClose();
                        }
                    },
                    validationSchema: RELEASE_ACTION_FORM_SCHEMA,
                    initialValues: INITIAL_VALUES,
                    children: ({ values, setFieldValue })=>/*#__PURE__*/ jsxs(Form, {
                            children: [
                                releases?.length === 0 ? /*#__PURE__*/ jsx(NoReleases, {}) : /*#__PURE__*/ jsx(Modal.Body, {
                                    children: /*#__PURE__*/ jsxs(Flex, {
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
                                                                id: 'content-releases.content-manager-list-view.add-to-release.select-label',
                                                                defaultMessage: 'Select a release'
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsx(SingleSelect, {
                                                            placeholder: formatMessage({
                                                                id: 'content-releases.content-manager-list-view.add-to-release.select-placeholder',
                                                                defaultMessage: 'Select'
                                                            }),
                                                            onChange: (value)=>setFieldValue('releaseId', value),
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
                                                    id: 'content-releases.content-manager-list-view.add-to-release.action-type-label',
                                                    defaultMessage: 'What do you want to do with these entries?'
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(ReleaseActionOptions, {
                                                selected: values.type,
                                                handleChange: (e)=>setFieldValue('type', e.target.value),
                                                name: "type"
                                            })
                                        ]
                                    })
                                }),
                                /*#__PURE__*/ jsxs(Modal.Footer, {
                                    children: [
                                        /*#__PURE__*/ jsx(Button, {
                                            onClick: onClose,
                                            variant: "tertiary",
                                            name: "cancel",
                                            children: formatMessage({
                                                id: 'content-releases.content-manager-list-view.add-to-release.cancel-button',
                                                defaultMessage: 'Cancel'
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Button, {
                                            type: "submit",
                                            disabled: !values.releaseId,
                                            loading: isLoading,
                                            children: formatMessage({
                                                id: 'content-releases.content-manager-list-view.add-to-release.continue-button',
                                                defaultMessage: 'Continue'
                                            })
                                        })
                                    ]
                                })
                            ]
                        })
                });
            }
        }
    };
};

export { ReleaseAction };
//# sourceMappingURL=ReleaseAction.mjs.map
