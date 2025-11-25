import { jsx } from 'react/jsx-runtime';
import { useNotification, useClipboard } from '@strapi/admin/strapi-admin';
import { IconButton } from '@strapi/design-system';
import { Link } from '@strapi/icons';
import { useIntl } from 'react-intl';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../utils/getTrad.mjs';
import 'qs';
import '../../constants.mjs';
import '../../utils/urlYupSchema.mjs';

// TODO: find a better naming convention for the file that was an index file before
const CopyLinkButton = ({ url })=>{
    const { toggleNotification } = useNotification();
    const { formatMessage } = useIntl();
    const { copy } = useClipboard();
    const handleClick = async ()=>{
        const didCopy = await copy(url);
        if (didCopy) {
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'notification.link-copied',
                    defaultMessage: 'Link copied into the clipboard'
                })
            });
        }
    };
    return /*#__PURE__*/ jsx(IconButton, {
        label: formatMessage({
            id: getTrad('control-card.copy-link'),
            defaultMessage: 'Copy link'
        }),
        onClick: handleClick,
        children: /*#__PURE__*/ jsx(Link, {})
    });
};

export { CopyLinkButton };
//# sourceMappingURL=CopyLinkButton.mjs.map
