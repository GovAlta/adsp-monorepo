'use strict';

var React = require('react');
var Notifications = require('../../../../../../../../admin/src/features/Notifications.js');
var useAPIErrorHandler = require('../../../../../../../../admin/src/hooks/useAPIErrorHandler.js');
var useQueryParams = require('../../../../../../../../admin/src/hooks/useQueryParams.js');
var users = require('../../../../../../../../admin/src/services/users.js');
var auditLogs = require('../../../../../services/auditLogs.js');

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

const useAuditLogsData = ({ canReadAuditLogs, canReadUsers })=>{
    const { toggleNotification } = Notifications.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler.useAPIErrorHandler();
    const [{ query }] = useQueryParams.useQueryParams();
    const { data, error, isError: isUsersError, isLoading: isLoadingUsers } = users.useAdminUsers({}, {
        skip: !canReadUsers,
        refetchOnMountOrArgChange: true
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
        toggleNotification,
        formatAPIError
    ]);
    const { data: auditLogs$1, isLoading: isLoadingAuditLogs, isError: isAuditLogsError, error: auditLogsError } = auditLogs.useGetAuditLogsQuery(query, {
        refetchOnMountOrArgChange: true,
        skip: !canReadAuditLogs
    });
    React__namespace.useEffect(()=>{
        if (auditLogsError) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(auditLogsError)
            });
        }
    }, [
        auditLogsError,
        toggleNotification,
        formatAPIError
    ]);
    return {
        auditLogs: auditLogs$1,
        users: data?.users ?? [],
        isLoading: isLoadingUsers || isLoadingAuditLogs,
        hasError: isAuditLogsError || isUsersError
    };
};

exports.useAuditLogsData = useAuditLogsData;
//# sourceMappingURL=useAuditLogsData.js.map
