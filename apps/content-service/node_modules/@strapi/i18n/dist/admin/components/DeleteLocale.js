'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var locales = require('../services/locales.js');
var getTranslation = require('../utils/getTranslation.js');

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

const DeleteLocale = ({ id, name })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const [visible, setVisible] = React__namespace.useState(false);
    const [deleteLocale] = locales.useDeleteLocaleMutation();
    const handleConfirm = async ()=>{
        try {
            const res = await deleteLocale(id);
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
                    id: getTranslation.getTranslation('Settings.locales.modal.delete.success'),
                    defaultMessage: 'Deleted locale'
                })
            });
            setVisible(false);
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred, please try again'
                })
            });
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Root, {
        open: visible,
        onOpenChange: setVisible,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Trigger, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                    onClick: ()=>setVisible(true),
                    label: formatMessage({
                        id: getTranslation.getTranslation('Settings.list.actions.delete'),
                        defaultMessage: 'Delete {name} locale'
                    }, {
                        name
                    }),
                    variant: "ghost",
                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Trash, {})
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
                onConfirm: handleConfirm
            })
        ]
    });
};

exports.DeleteLocale = DeleteLocale;
//# sourceMappingURL=DeleteLocale.js.map
