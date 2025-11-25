import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking } from '@strapi/admin/strapi-admin';
import { useNotifyAT } from '@strapi/design-system';
import { Page, useNotification, useFetchClient, useAPIErrorHandler, useRBAC, Layouts } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { useQueryClient, useQuery, useMutation } from 'react-query';
import { PERMISSIONS } from '../../constants.mjs';
import 'lodash/isEmpty';
import getTrad from '../../utils/getTrad.mjs';
import EmailForm from './components/EmailForm.mjs';
import EmailTable from './components/EmailTable.mjs';

const ProtectedEmailTemplatesPage = ()=>/*#__PURE__*/ jsx(Page.Protect, {
        permissions: PERMISSIONS.readEmailTemplates,
        children: /*#__PURE__*/ jsx(EmailTemplatesPage, {})
    });
const EmailTemplatesPage = ()=>{
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const { notifyStatus } = useNotifyAT();
    const { toggleNotification } = useNotification();
    const queryClient = useQueryClient();
    const { get, put } = useFetchClient();
    const { formatAPIError } = useAPIErrorHandler();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [templateToEdit, setTemplateToEdit] = React.useState(null);
    const { isLoading: isLoadingForPermissions, allowedActions: { canUpdate } } = useRBAC({
        update: PERMISSIONS.updateEmailTemplates
    });
    const { isLoading: isLoadingData, data } = useQuery([
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
    const submitMutation = useMutation((body)=>put('/users-permissions/email-templates', {
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
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsxs(Page.Main, {
        "aria-busy": submitMutation.isLoading,
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
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
            /*#__PURE__*/ jsx(Layouts.Header, {
                title: formatMessage({
                    id: getTrad('HeaderNav.link.emailTemplates'),
                    defaultMessage: 'Email templates'
                })
            }),
            /*#__PURE__*/ jsxs(Layouts.Content, {
                children: [
                    /*#__PURE__*/ jsx(EmailTable, {
                        onEditClick: handleEditClick,
                        canUpdate: canUpdate
                    }),
                    /*#__PURE__*/ jsx(EmailForm, {
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

export { EmailTemplatesPage, ProtectedEmailTemplatesPage };
//# sourceMappingURL=index.mjs.map
