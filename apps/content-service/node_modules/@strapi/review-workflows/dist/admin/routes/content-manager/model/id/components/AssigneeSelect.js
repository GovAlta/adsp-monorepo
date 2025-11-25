'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var strapiAdmin$1 = require('@strapi/content-manager/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var hooks = require('../../../../../modules/hooks.js');
var contentManager = require('../../../../../services/content-manager.js');
var api = require('../../../../../utils/api.js');
var users = require('../../../../../utils/users.js');
var constants = require('./constants.js');

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

const AssigneeSelect = ({ isCompact })=>{
    const { collectionType = '', id, slug: model = '' } = reactRouterDom.useParams();
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions);
    const { formatMessage } = reactIntl.useIntl();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { allowedActions: { canRead }, isLoading: isLoadingPermissions } = strapiAdmin.useRBAC(permissions.settings?.users);
    const [{ query }] = strapiAdmin.useQueryParams();
    const params = React__namespace.useMemo(()=>api.buildValidParams(query), [
        query
    ]);
    const { data, isLoading: isLoadingUsers, isError } = strapiAdmin.useAdminUsers(undefined, {
        skip: isLoadingPermissions || !canRead
    });
    const { document } = strapiAdmin$1.unstable_useDocument({
        collectionType,
        model,
        documentId: id
    }, {
        skip: !id && collectionType !== 'single-types'
    });
    const users$1 = data?.users || [];
    const currentAssignee = document ? document[constants.ASSIGNEE_ATTRIBUTE_NAME] : null;
    const [updateAssignee, { error, isLoading: isMutating }] = contentManager.useUpdateAssigneeMutation();
    if (!collectionType || !model || !document?.documentId) {
        return null;
    }
    const handleChange = async (assigneeId)=>{
        // a simple way to avoid erroneous updates
        if (currentAssignee?.id === assigneeId) {
            return;
        }
        const res = await updateAssignee({
            slug: collectionType,
            model,
            id: document.documentId,
            params,
            data: {
                id: assigneeId ? parseInt(assigneeId, 10) : null
            }
        });
        if ('data' in res) {
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'content-manager.reviewWorkflows.assignee.notification.saved',
                    defaultMessage: 'Assignee updated'
                })
            });
        }
        if (isCompact && 'error' in res) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(res.error)
            });
        }
    };
    const isDisabled = !isLoadingPermissions && !isLoadingUsers && users$1.length === 0 || !document.documentId;
    const isLoading = isLoadingUsers || isLoadingPermissions || isMutating;
    const assigneeLabel = formatMessage({
        id: 'content-manager.reviewWorkflows.assignee.label',
        defaultMessage: 'Assignee'
    });
    const assigneeClearLabel = formatMessage({
        id: 'content-manager.reviewWorkflows.assignee.clear',
        defaultMessage: 'Clear assignee'
    });
    const assigneePlaceholder = formatMessage({
        id: 'content-manager.reviewWorkflows.assignee.placeholder',
        defaultMessage: 'Select…'
    });
    if (isCompact) {
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
            name: constants.ASSIGNEE_ATTRIBUTE_NAME,
            id: constants.ASSIGNEE_ATTRIBUTE_NAME,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                        children: assigneeLabel
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Combobox, {
                    clearLabel: assigneeClearLabel,
                    disabled: isDisabled,
                    value: currentAssignee ? currentAssignee.id.toString() : null,
                    onChange: handleChange,
                    onClear: ()=>handleChange(null),
                    placeholder: assigneePlaceholder,
                    loading: isLoading || isLoadingPermissions || isMutating,
                    size: "S",
                    children: users$1.map((user)=>{
                        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.ComboboxOption, {
                            value: user.id.toString(),
                            textValue: users.getDisplayName(user),
                            children: users.getDisplayName(user)
                        }, user.id);
                    })
                })
            ]
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        name: constants.ASSIGNEE_ATTRIBUTE_NAME,
        id: constants.ASSIGNEE_ATTRIBUTE_NAME,
        error: (isError && canRead && formatMessage({
            id: 'content-manager.reviewWorkflows.assignee.error',
            defaultMessage: 'An error occurred while fetching users'
        }) || error && formatAPIError(error)) ?? undefined,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: assigneeLabel
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Combobox, {
                clearLabel: assigneeClearLabel,
                disabled: !isLoadingPermissions && !isLoading && users$1.length === 0 || !document.documentId,
                value: currentAssignee ? currentAssignee.id.toString() : null,
                onChange: handleChange,
                onClear: ()=>handleChange(null),
                placeholder: assigneePlaceholder,
                loading: isLoading || isLoadingPermissions || isMutating,
                children: users$1.map((user)=>{
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.ComboboxOption, {
                        value: user.id.toString(),
                        textValue: users.getDisplayName(user),
                        children: users.getDisplayName(user)
                    }, user.id);
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
};

exports.AssigneeSelect = AssigneeSelect;
//# sourceMappingURL=AssigneeSelect.js.map
