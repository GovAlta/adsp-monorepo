import { jsx } from 'react/jsx-runtime';
import { IconButton } from '@strapi/design-system';
import { Duplicate } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ContentBox } from '../../../../../components/ContentBox.mjs';
import { useNotification } from '../../../../../features/Notifications.mjs';
import { useClipboard } from '../../../../../hooks/useClipboard.mjs';

const MagicLinkWrapper = ({ children, target })=>{
    const { toggleNotification } = useNotification();
    const { formatMessage } = useIntl();
    const { copy } = useClipboard();
    const copyLabel = formatMessage({
        id: 'app.component.CopyToClipboard.label',
        defaultMessage: 'Copy to clipboard'
    });
    const handleClick = async (e)=>{
        e.preventDefault();
        const didCopy = await copy(target);
        if (didCopy) {
            toggleNotification({
                type: 'info',
                message: formatMessage({
                    id: 'notification.link-copied'
                })
            });
        }
    };
    return /*#__PURE__*/ jsx(ContentBox, {
        endAction: /*#__PURE__*/ jsx(IconButton, {
            label: copyLabel,
            variant: "ghost",
            onClick: handleClick,
            children: /*#__PURE__*/ jsx(Duplicate, {})
        }),
        title: target,
        titleEllipsis: true,
        subtitle: children,
        icon: /*#__PURE__*/ jsx("span", {
            style: {
                fontSize: 32
            },
            children: "✉️"
        }),
        iconBackground: "neutral100"
    });
};

export { MagicLinkWrapper };
//# sourceMappingURL=MagicLinkWrapper.mjs.map
