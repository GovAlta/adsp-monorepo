import { jsx } from 'react/jsx-runtime';
import { Button } from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { EmptyPermissions } from '@strapi/icons/symbols';
import { useIntl } from 'react-intl';
import { EmptyAssets } from '../../../../components/EmptyAssets/EmptyAssets.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../../utils/getTrad.mjs';
import 'qs';
import '../../../../constants.mjs';
import '../../../../utils/urlYupSchema.mjs';

const getContentIntlMessage = ({ isFiltering, canCreate, canRead })=>{
    if (isFiltering) {
        return {
            id: 'list.assets-empty.title-withSearch',
            defaultMessage: 'There are no elements with the applied filters'
        };
    }
    if (canRead) {
        if (canCreate) {
            return {
                id: 'list.assets.empty-upload',
                defaultMessage: 'Upload your first assets...'
            };
        }
        return {
            id: 'list.assets.empty',
            defaultMessage: 'Media Library is empty'
        };
    }
    return {
        id: 'header.actions.no-permissions',
        defaultMessage: 'No permissions to view'
    };
};
const EmptyOrNoPermissions = ({ canCreate, isFiltering, canRead, onActionClick })=>{
    const { formatMessage } = useIntl();
    const content = getContentIntlMessage({
        isFiltering,
        canCreate,
        canRead
    });
    return /*#__PURE__*/ jsx(EmptyAssets, {
        icon: !canRead ? EmptyPermissions : undefined,
        action: canCreate && !isFiltering && /*#__PURE__*/ jsx(Button, {
            variant: "secondary",
            startIcon: /*#__PURE__*/ jsx(Plus, {}),
            onClick: onActionClick,
            children: formatMessage({
                id: getTrad('header.actions.add-assets'),
                defaultMessage: 'Add new assets'
            })
        }),
        content: formatMessage({
            ...content,
            id: getTrad(content.id)
        })
    });
};

export { EmptyOrNoPermissions };
//# sourceMappingURL=EmptyOrNoPermissions.mjs.map
