'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var strapiAdmin$1 = require('@strapi/content-manager/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var symbols = require('@strapi/icons/symbols');
var formik = require('formik');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var yup = require('yup');
var constants = require('../constants.js');
var release = require('../services/release.js');
var ReleaseActionOptions = require('./ReleaseActionOptions.js');

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

var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

/* -------------------------------------------------------------------------------------------------
 * AddActionToReleaseModal
 * -----------------------------------------------------------------------------------------------*/ const RELEASE_ACTION_FORM_SCHEMA = yup__namespace.object().shape({
    type: yup__namespace.string().oneOf([
        'publish',
        'unpublish'
    ]).required(),
    releaseId: yup__namespace.string().required()
});
const INITIAL_VALUES = {
    type: 'publish',
    releaseId: ''
};
const NoReleases = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.EmptyStateLayout, {
        icon: /*#__PURE__*/ jsxRuntime.jsx(symbols.EmptyDocuments, {
            width: "16rem"
        }),
        content: formatMessage({
            id: 'content-releases.content-manager-edit-view.add-to-release.no-releases-message',
            defaultMessage: 'No available releases. Open the list of releases and create a new one from there.'
        }),
        action: /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
            to: {
                pathname: '/plugins/content-releases'
            },
            tag: reactRouterDom.Link,
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
    const { formatMessage } = reactIntl.useIntl();
    const [{ query }] = strapiAdmin.useQueryParams();
    const locale = query.plugins?.i18n?.locale;
    // Get all 'pending' releases that do not have the entry attached
    const response = release.useGetReleasesForEntryQuery({
        contentType,
        entryDocumentId: documentId,
        hasEntryAttached: false,
        locale
    });
    const releases = response.data?.data;
    if (releases?.length === 0) {
        return /*#__PURE__*/ jsxRuntime.jsx(NoReleases, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
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
                                id: 'content-releases.content-manager-edit-view.add-to-release.select-label',
                                defaultMessage: 'Select a release'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                            required: true,
                            placeholder: formatMessage({
                                id: 'content-releases.content-manager-edit-view.add-to-release.select-placeholder',
                                defaultMessage: 'Select'
                            }),
                            name: "releaseId",
                            onChange: (value)=>onInputChange('releaseId', value),
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
                    id: 'content-releases.content-manager-edit-view.add-to-release.action-type-label',
                    defaultMessage: 'What do you want to do with this entry?'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(ReleaseActionOptions.ReleaseActionOptions, {
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
    const { formatMessage } = reactIntl.useIntl();
    const { allowedActions } = strapiAdmin.useRBAC(constants.PERMISSIONS);
    const { canCreateAction } = allowedActions;
    const [createReleaseAction, { isLoading }] = release.useCreateReleaseActionMutation();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const [{ query }] = strapiAdmin.useQueryParams();
    const locale = query.plugins?.i18n?.locale;
    const handleSubmit = async (e, onClose)=>{
        try {
            await formik$1.handleSubmit(e);
            onClose();
        } catch (error) {
            if (strapiAdmin.isFetchError(error)) {
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
    const formik$1 = formik.useFormik({
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
    const { edit: { options } } = strapiAdmin$1.unstable_useDocumentLayout(model);
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
        icon: /*#__PURE__*/ jsxRuntime.jsx(icons.PaperPlane, {}),
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
            content: /*#__PURE__*/ jsxRuntime.jsx(AddActionToReleaseModal, {
                contentType: model,
                documentId: documentId,
                onInputChange: formik$1.setFieldValue,
                values: formik$1.values
            }),
            footer: ({ onClose })=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            onClick: onClose,
                            variant: "tertiary",
                            name: "cancel",
                            children: formatMessage({
                                id: 'content-releases.content-manager-edit-view.add-to-release.cancel-button',
                                defaultMessage: 'Cancel'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            type: "submit",
                            // @ts-expect-error - formik ReactEvent types don't match button onClick types as they expect a MouseEvent
                            onClick: (e)=>handleSubmit(e, onClose),
                            disabled: !formik$1.values.releaseId,
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

exports.INITIAL_VALUES = INITIAL_VALUES;
exports.NoReleases = NoReleases;
exports.RELEASE_ACTION_FORM_SCHEMA = RELEASE_ACTION_FORM_SCHEMA;
exports.ReleaseActionModalForm = ReleaseActionModalForm;
//# sourceMappingURL=ReleaseActionModal.js.map
