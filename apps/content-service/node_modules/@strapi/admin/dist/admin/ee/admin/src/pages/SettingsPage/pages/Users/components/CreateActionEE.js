'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var isNil = require('lodash/isNil');
var reactIntl = require('react-intl');
var useLicenseLimits = require('../../../../../hooks/useLicenseLimits.js');

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

const CreateActionEE = /*#__PURE__*/ React__namespace.forwardRef((props, ref)=>{
    const { formatMessage } = reactIntl.useIntl();
    const { license, isError, isLoading } = useLicenseLimits.useLicenseLimits();
    const { permittedSeats, shouldStopCreate } = license ?? {};
    if (isError || isLoading) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        gap: 2,
        children: [
            !isNil(permittedSeats) && shouldStopCreate && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
                label: formatMessage({
                    id: 'Settings.application.admin-seats.at-limit-tooltip',
                    defaultMessage: 'At limit: add seats to invite more users'
                }),
                side: "left",
                children: /*#__PURE__*/ jsxRuntime.jsx(icons.WarningCircle, {
                    width: "1.4rem",
                    height: "1.4rem",
                    fill: "danger500"
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                ref: ref,
                "data-testid": "create-user-button",
                startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Mail, {}),
                size: "S",
                disabled: shouldStopCreate,
                ...props,
                children: formatMessage({
                    id: 'Settings.permissions.users.create',
                    defaultMessage: 'Invite new user'
                })
            })
        ]
    });
});

exports.CreateActionEE = CreateActionEE;
//# sourceMappingURL=CreateActionEE.js.map
