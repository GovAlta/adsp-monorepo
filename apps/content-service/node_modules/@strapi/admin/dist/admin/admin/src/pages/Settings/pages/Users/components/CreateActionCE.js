'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');

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

const CreateActionCE = /*#__PURE__*/ React__namespace.forwardRef((props, ref)=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
        ref: ref,
        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Mail, {}),
        size: "S",
        ...props,
        children: formatMessage({
            id: 'Settings.permissions.users.create',
            defaultMessage: 'Invite new user'
        })
    });
});

exports.CreateActionCE = CreateActionCE;
//# sourceMappingURL=CreateActionCE.js.map
