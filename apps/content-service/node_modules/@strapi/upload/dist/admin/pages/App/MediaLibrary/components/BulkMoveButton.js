'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var BulkMoveDialog = require('../../../../components/BulkMoveDialog/BulkMoveDialog.js');

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

const BulkMoveButton = ({ selected = [], onSuccess, currentFolder })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [showConfirmDialog, setShowConfirmDialog] = React__namespace.useState(false);
    const handleConfirmMove = ()=>{
        setShowConfirmDialog(false);
        onSuccess();
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Root, {
        open: showConfirmDialog,
        onOpenChange: setShowConfirmDialog,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Trigger, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    variant: "secondary",
                    size: "S",
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Folder, {}),
                    children: formatMessage({
                        id: 'global.move',
                        defaultMessage: 'Move'
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(BulkMoveDialog.BulkMoveDialog, {
                currentFolder: currentFolder,
                onClose: handleConfirmMove,
                selected: selected
            })
        ]
    });
};

exports.BulkMoveButton = BulkMoveButton;
//# sourceMappingURL=BulkMoveButton.js.map
