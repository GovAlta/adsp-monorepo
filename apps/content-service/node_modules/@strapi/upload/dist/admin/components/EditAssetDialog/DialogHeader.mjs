import { jsx } from 'react/jsx-runtime';
import { Modal } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const DialogHeader = ()=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Modal.Header, {
        children: /*#__PURE__*/ jsx(Modal.Title, {
            children: formatMessage({
                id: 'global.details',
                defaultMessage: 'Details'
            })
        })
    });
};

export { DialogHeader };
//# sourceMappingURL=DialogHeader.mjs.map
