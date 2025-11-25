'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var strapiAdmin$1 = require('@strapi/content-manager/strapi-admin');
var designSystem = require('@strapi/design-system');
var formik = require('formik');
var reactIntl = require('react-intl');
var constants = require('../constants.js');
var release = require('../services/release.js');
var ReleaseActionModal = require('./ReleaseActionModal.js');
var ReleaseActionOptions = require('./ReleaseActionOptions.js');

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
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const [{ query }] = strapiAdmin.useQueryParams();
    const contentPermissions = getContentPermissions(model);
    const { allowedActions: { canPublish } } = strapiAdmin.useRBAC(contentPermissions);
    const { allowedActions: { canCreate } } = strapiAdmin.useRBAC(constants.PERMISSIONS);
    const { hasDraftAndPublish } = strapiAdmin$1.unstable_useContentManagerContext();
    // Get all the releases not published
    const response = release.useGetReleasesQuery();
    const releases = response.data?.data;
    const [createManyReleaseActions, { isLoading }] = release.useCreateManyReleaseActionsMutation();
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
            if (strapiAdmin.isFetchError(response.error)) {
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
                return /*#__PURE__*/ jsxRuntime.jsx(formik.Formik, {
                    onSubmit: async (values)=>{
                        const data = await handleSubmit(values);
                        if (data) {
                            return onClose();
                        }
                    },
                    validationSchema: ReleaseActionModal.RELEASE_ACTION_FORM_SCHEMA,
                    initialValues: ReleaseActionModal.INITIAL_VALUES,
                    children: ({ values, setFieldValue })=>/*#__PURE__*/ jsxRuntime.jsxs(formik.Form, {
                            children: [
                                releases?.length === 0 ? /*#__PURE__*/ jsxRuntime.jsx(ReleaseActionModal.NoReleases, {}) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 2,
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                                paddingBottom: 6,
                                                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                                                    required: true,
                                                    children: [
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                                            children: formatMessage({
                                                                id: 'content-releases.content-manager-list-view.add-to-release.select-label',
                                                                defaultMessage: 'Select a release'
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                                                            placeholder: formatMessage({
                                                                id: 'content-releases.content-manager-list-view.add-to-release.select-placeholder',
                                                                defaultMessage: 'Select'
                                                            }),
                                                            onChange: (value)=>setFieldValue('releaseId', value),
                                                            value: values.releaseId,
                                                            children: releases?.map((release)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                                                    value: release.id,
                                                                    children: release.name
                                                                }, release.id))
                                                        })
                                                    ]
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                                children: formatMessage({
                                                    id: 'content-releases.content-manager-list-view.add-to-release.action-type-label',
                                                    defaultMessage: 'What do you want to do with these entries?'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(ReleaseActionOptions.ReleaseActionOptions, {
                                                selected: values.type,
                                                handleChange: (e)=>setFieldValue('type', e.target.value),
                                                name: "type"
                                            })
                                        ]
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                            onClick: onClose,
                                            variant: "tertiary",
                                            name: "cancel",
                                            children: formatMessage({
                                                id: 'content-releases.content-manager-list-view.add-to-release.cancel-button',
                                                defaultMessage: 'Cancel'
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
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

exports.ReleaseAction = ReleaseAction;
//# sourceMappingURL=ReleaseAction.js.map
