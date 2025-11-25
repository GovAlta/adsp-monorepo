'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styled = require('styled-components');

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

/**
 * @beta
 * @public
 * @description A simple confirm dialog that out of the box can be used to confirm an action.
 * The component can additionally be customised if required e.g. the footer actions can be
 * completely replaced, but cannot be removed. Passing a string as the children prop will render
 * the string as the body of the dialog. If you need more control over the body, you can pass a
 * custom component as the children prop.
 * @example
 * ```tsx
 * import { Dialog } from '@strapi/design-system';
 *
 * const DeleteAction = ({ id }) => {
 *  const [isOpen, setIsOpen] = React.useState(false);
 *
 *  const [delete] = useDeleteMutation()
 *  const handleConfirm = async () => {
 *    await delete(id)
 *    setIsOpen(false)
 *  }
 *
 *  return (
 *    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
 *      <Dialog.Trigger>
 *        <Button>Delete</Button>
 *      </Dialog.Trigger>
 *      <ConfirmDialog onConfirm={handleConfirm} />
 *    </Dialog.Root>
 *  )
 * }
 * ```
 */ const ConfirmDialog = ({ children, icon = /*#__PURE__*/ jsxRuntime.jsx(StyledWarning, {}), onConfirm, onCancel, variant = 'danger-light', startAction, endAction, title })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [isConfirming, setIsConfirming] = React__namespace.useState(false);
    const content = children || formatMessage({
        id: 'app.confirm.body',
        defaultMessage: 'Are you sure?'
    });
    const handleConfirm = async (e)=>{
        if (!onConfirm) {
            return;
        }
        try {
            setIsConfirming(true);
            await onConfirm(e);
        } finally{
            setIsConfirming(false);
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Content, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Header, {
                children: title || formatMessage({
                    id: 'app.components.ConfirmDialog.title',
                    defaultMessage: 'Confirmation'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Body, {
                icon: icon,
                children: content
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Footer, {
                children: [
                    startAction || /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Cancel, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            fullWidth: true,
                            variant: "tertiary",
                            onClick: (e)=>{
                                e.stopPropagation();
                                if (onCancel) {
                                    onCancel(e);
                                }
                            },
                            children: formatMessage({
                                id: 'app.components.Button.cancel',
                                defaultMessage: 'Cancel'
                            })
                        })
                    }),
                    endAction || /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Action, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            fullWidth: true,
                            onClick: handleConfirm,
                            variant: variant,
                            loading: isConfirming,
                            children: formatMessage({
                                id: 'app.components.Button.confirm',
                                defaultMessage: 'Confirm'
                            })
                        })
                    })
                ]
            })
        ]
    });
};
const StyledWarning = styled.styled(icons.WarningCircle)`
  width: 24px;
  height: 24px;

  path {
    fill: ${({ theme })=>theme.colors.danger600};
  }
`;

exports.ConfirmDialog = ConfirmDialog;
//# sourceMappingURL=ConfirmDialog.js.map
