'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var admin = require('@strapi/strapi/admin');
var reactIntl = require('react-intl');
var reactQuery = require('react-query');
var constants = require('../../constants.js');
require('lodash/isEmpty');
var getTrad = require('../../utils/getTrad.js');
var EmailForm = require('./components/EmailForm.js');
var EmailTable = require('./components/EmailTable.js');

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

const ProtectedEmailTemplatesPage = ()=>/*#__PURE__*/ jsxRuntime.jsx(admin.Page.Protect, {
        permissions: constants.PERMISSIONS.readEmailTemplates,
        children: /*#__PURE__*/ jsxRuntime.jsx(EmailTemplatesPage, {})
    });
const EmailTemplatesPage = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = strapiAdmin.useTracking();
    const { notifyStatus } = designSystem.useNotifyAT();
    const { toggleNotification } = admin.useNotification();
    const queryClient = reactQuery.useQueryClient();
    const { get, put } = admin.useFetchClient();
    const { formatAPIError } = admin.useAPIErrorHandler();
    const [isModalOpen, setIsModalOpen] = React__namespace.useState(false);
    const [templateToEdit, setTemplateToEdit] = React__namespace.useState(null);
    const { isLoading: isLoadingForPermissions, allowedActions: { canUpdate } } = admin.useRBAC({
        update: constants.PERMISSIONS.updateEmailTemplates
    });
    const { isLoading: isLoadingData, data } = reactQuery.useQuery([
        'users-permissions',
        'email-templates'
    ], async ()=>{
        const { data } = await get('/users-permissions/email-templates');
        return data;
    }, {
        onSuccess () {
            notifyStatus(formatMessage({
                id: getTrad('Email.template.data.loaded'),
                defaultMessage: 'Email templates has been loaded'
            }));
        },
        onError (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        }
    });
    const isLoading = isLoadingForPermissions || isLoadingData;
    const handleToggle = ()=>{
        setIsModalOpen((prev)=>!prev);
    };
    const handleEditClick = (template)=>{
        setTemplateToEdit(template);
        handleToggle();
    };
    const submitMutation = reactQuery.useMutation((body)=>put('/users-permissions/email-templates', {
            'email-templates': body
        }), {
        async onSuccess () {
            await queryClient.invalidateQueries([
                'users-permissions',
                'email-templates'
            ]);
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'notification.success.saved',
                    defaultMessage: 'Saved'
                })
            });
            trackUsage('didEditEmailTemplates');
            handleToggle();
        },
        onError (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        },
        refetchActive: true
    });
    const handleSubmit = (body)=>{
        trackUsage('willEditEmailTemplates');
        const editedTemplates = {
            ...data,
            [templateToEdit]: body
        };
        submitMutation.mutate(editedTemplates);
    };
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(admin.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(admin.Page.Main, {
        "aria-busy": submitMutation.isLoading,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(admin.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: formatMessage({
                        id: getTrad('HeaderNav.link.emailTemplates'),
                        defaultMessage: 'Email templates'
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(admin.Layouts.Header, {
                title: formatMessage({
                    id: getTrad('HeaderNav.link.emailTemplates'),
                    defaultMessage: 'Email templates'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(admin.Layouts.Content, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(EmailTable, {
                        onEditClick: handleEditClick,
                        canUpdate: canUpdate
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(EmailForm, {
                        template: data[templateToEdit],
                        onToggle: handleToggle,
                        open: isModalOpen,
                        onSubmit: handleSubmit
                    })
                ]
            })
        ]
    });
};

exports.EmailTemplatesPage = EmailTemplatesPage;
exports.ProtectedEmailTemplatesPage = ProtectedEmailTemplatesPage;
//# sourceMappingURL=index.js.map
