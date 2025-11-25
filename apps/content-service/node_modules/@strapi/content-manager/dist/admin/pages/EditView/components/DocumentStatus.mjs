import { jsx } from 'react/jsx-runtime';
import { Status, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { capitalise } from '../../../utils/strings.mjs';

/**
 * @public
 * @description Displays the status of a document (draft, published, etc.)
 * and automatically calculates the appropriate variant for the status.
 */ const DocumentStatus = ({ status = 'draft', size = 'S', ...restProps })=>{
    const statusVariant = status === 'draft' ? 'secondary' : status === 'published' ? 'success' : 'alternative';
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Status, {
        ...restProps,
        size: size,
        variant: statusVariant,
        role: "status",
        "aria-label": status,
        children: /*#__PURE__*/ jsx(Typography, {
            tag: "span",
            variant: "omega",
            fontWeight: "bold",
            children: formatMessage({
                id: `content-manager.containers.List.${status}`,
                defaultMessage: capitalise(status)
            })
        })
    });
};

export { DocumentStatus };
//# sourceMappingURL=DocumentStatus.mjs.map
