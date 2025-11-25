'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactIntl = require('react-intl');
var settings = require('../../../services/settings.js');

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

const DEFAULT_UNEXPECTED_ERROR_MSG = {
    id: 'notification.error',
    defaultMessage: 'An error occurred, please try again'
};
const useReviewWorkflows = (params = {})=>{
    const { toggleNotification } = strapiAdmin.useNotification();
    const { formatMessage } = reactIntl.useIntl();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const { skip = false, ...queryParams } = params;
    const { data, isLoading, error } = settings.useGetWorkflowsQuery({
        ...queryParams
    }, {
        skip
    });
    React__namespace.useEffect(()=>{
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
    const [createWorkflow] = settings.useCreateWorkflowMutation();
    const create = React__namespace.useCallback(async (data)=>{
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
    const [updateWorkflow] = settings.useUpdateWorkflowMutation();
    const update = React__namespace.useCallback(async (id, data)=>{
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
    const [deleteWorkflow] = settings.useDeleteWorkflowMutation();
    const deleteAction = React__namespace.useCallback(async (id)=>{
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

exports.useReviewWorkflows = useReviewWorkflows;
//# sourceMappingURL=useReviewWorkflows.js.map
