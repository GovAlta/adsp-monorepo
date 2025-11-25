import { jsxs, jsx } from 'react/jsx-runtime';
import { Modal, Button } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const DialogFooter = ({ onClose, onValidate })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Modal.Footer, {
        children: [
            /*#__PURE__*/ jsx(Button, {
                onClick: onClose,
                variant: "tertiary",
                children: formatMessage({
                    id: 'app.components.Button.cancel',
                    defaultMessage: 'Cancel'
                })
            }),
            onValidate && /*#__PURE__*/ jsx(Button, {
                onClick: onValidate,
                children: formatMessage({
                    id: 'global.finish',
                    defaultMessage: 'Finish'
                })
            })
        ]
    });
};

export { DialogFooter };
//# sourceMappingURL=DialogFooter.mjs.map
