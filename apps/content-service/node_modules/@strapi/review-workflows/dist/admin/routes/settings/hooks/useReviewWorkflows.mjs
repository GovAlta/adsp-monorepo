import * as React from 'react';
import { useNotification, useAPIErrorHandler } from '@strapi/admin/strapi-admin';
import { useIntl } from 'react-intl';
import { useGetWorkflowsQuery, useCreateWorkflowMutation, useUpdateWorkflowMutation, useDeleteWorkflowMutation } from '../../../services/settings.mjs';

const DEFAULT_UNEXPECTED_ERROR_MSG = {
    id: 'notification.error',
    defaultMessage: 'An error occurred, please try again'
};
const useReviewWorkflows = (params = {})=>{
    const { toggleNotification } = useNotification();
    const { formatMessage } = useIntl();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const { skip = false, ...queryParams } = params;
    const { data, isLoading, error } = useGetWorkflowsQuery({
        ...queryParams
    }, {
        skip
    });
    React.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        }
    }, [
        error,
        formatAPIError,
        toggleNotification
    ]);
    const [createWorkflow] = useCreateWorkflowMutation();
    const create = React.useCallback(async (data)=>{
        try {
            const res = await createWorkflow({
                data
            });
            if ('error' in res) {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(res.error)
                });
                return res;
            }
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'actions.created',
                    defaultMessage: 'Created workflow'
                })
            });
            return res;
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage(DEFAULT_UNEXPECTED_ERROR_MSG)
            });
            throw err;
        }
    }, [
        createWorkflow,
        formatAPIError,
        formatMessage,
        toggleNotification
    ]);
    const [updateWorkflow] = useUpdateWorkflowMutation();
    const update = React.useCallback(async (id, data)=>{
        try {
            const res = await updateWorkflow({
                id,
                data
            });
            if ('error' in res) {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(res.error)
                });
                return res;
            }
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'actions.updated',
                    defaultMessage: 'Updated workflow'
                })
            });
            return res;
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage(DEFAULT_UNEXPECTED_ERROR_MSG)
            });
            throw err;
        }
    }, [
        formatAPIError,
        formatMessage,
        toggleNotification,
        updateWorkflow
    ]);
    const [deleteWorkflow] = useDeleteWorkflowMutation();
    const deleteAction = React.useCallback(async (id)=>{
        try {
            const res = await deleteWorkflow({
                id
            });
            if ('error' in res) {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(res.error)
                });
                return;
            }
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'actions.deleted',
                    defaultMessage: 'Deleted workflow'
                })
            });
            return res.data;
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage(DEFAULT_UNEXPECTED_ERROR_MSG)
            });
            throw err;
        }
    }, [
        deleteWorkflow,
        formatAPIError,
        formatMessage,
        toggleNotification
    ]);
    const { workflows = [], meta } = data ?? {};
    return {
        // meta contains e.g. the total of all workflows. we can not use
        // the pagination object here, because the list is not paginated.
        meta,
        workflows,
        isLoading,
        error,
        create,
        delete: deleteAction,
        update
    };
};

export { useReviewWorkflows };
//# sourceMappingURL=useReviewWorkflows.mjs.map
