'use strict';

var React = require('react');
var isNil = require('lodash/isNil');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var Notifications = require('../../../../admin/src/features/Notifications.js');
var useLicenseLimits = require('./useLicenseLimits.js');

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

const STORAGE_KEY_PREFIX = 'strapi-notification-seat-limit';
const BILLING_SELF_HOSTED_URL = 'https://strapi.io/billing/request-seats';
const MANAGE_SEATS_URL = 'https://strapi.io/billing/manage-seats';
const useLicenseLimitNotification = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { license, isError, isLoading } = useLicenseLimits.useLicenseLimits();
    const { toggleNotification } = Notifications.useNotification();
    const { pathname } = reactRouterDom.useLocation();
    const { enforcementUserCount, permittedSeats, licenseLimitStatus, type } = license ?? {};
    React__namespace.useEffect(()=>{
        if (isError || isLoading) {
            return;
        }
        const shouldDisplayNotification = !isNil(permittedSeats) && !window.sessionStorage.getItem(`${STORAGE_KEY_PREFIX}-${pathname}`) && licenseLimitStatus === 'OVER_LIMIT';
        let notificationType;
        if (licenseLimitStatus === 'OVER_LIMIT') {
            notificationType = 'danger';
        }
        if (shouldDisplayNotification) {
            toggleNotification({
                type: notificationType,
                message: formatMessage({
                    id: 'notification.ee.warning.over-.message',
                    defaultMessage: "Add seats to {licenseLimitStatus, select, OVER_LIMIT {invite} other {re-enable}} Users. If you already did it but it's not reflected in Strapi yet, make sure to restart your app."
                }, {
                    licenseLimitStatus
                }),
                title: formatMessage({
                    id: 'notification.ee.warning.at-seat-limit.title',
                    defaultMessage: '{licenseLimitStatus, select, OVER_LIMIT {Over} other {At}} seat limit ({enforcementUserCount}/{permittedSeats})'
                }, {
                    licenseLimitStatus,
                    enforcementUserCount,
                    permittedSeats
                }),
                link: {
                    url: type === 'gold' ? BILLING_SELF_HOSTED_URL : MANAGE_SEATS_URL,
                    label: formatMessage({
                        id: 'notification.ee.warning.seat-limit.link',
                        defaultMessage: type === 'gold' ? 'Contact sales' : 'Manage seats'
                    })
                },
                blockTransition: true,
                onClose () {
                    window.sessionStorage.setItem(`${STORAGE_KEY_PREFIX}-${pathname}`, 'true');
                }
            });
        }
    }, [
        toggleNotification,
        license,
        pathname,
        formatMessage,
        isLoading,
        permittedSeats,
        licenseLimitStatus,
        enforcementUserCount,
        isError,
        type
    ]);
};

exports.useLicenseLimitNotification = useLicenseLimitNotification;
//# sourceMappingURL=useLicenseLimitNotification.js.map
