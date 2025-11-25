import { jsx, jsxs } from 'react/jsx-runtime';
import { useQueryParams, Layouts } from '@strapi/admin/strapi-admin';
import { Link, Flex, Button } from '@strapi/design-system';
import { ArrowLeft, Plus } from '@strapi/icons';
import { stringify } from 'qs';
import { useIntl } from 'react-intl';
import { useLocation, NavLink } from 'react-router-dom';
import { Breadcrumbs } from '../../../../components/Breadcrumbs/Breadcrumbs.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../../utils/getTrad.mjs';
import '../../../../constants.mjs';
import '../../../../utils/urlYupSchema.mjs';

const Header = ({ breadcrumbs = null, canCreate, folder = null, onToggleEditFolderDialog, onToggleUploadAssetDialog })=>{
    const { formatMessage } = useIntl();
    const { pathname } = useLocation();
    const [{ query }] = useQueryParams();
    const backQuery = {
        ...query,
        folder: folder?.parent && typeof folder.parent !== 'number' && folder.parent.id ? folder.parent.id : undefined,
        folderPath: folder?.parent && typeof folder.parent !== 'number' && folder.parent.path ? folder.parent.path : undefined
    };
    return /*#__PURE__*/ jsx(Layouts.Header, {
        title: formatMessage({
            id: getTrad('plugin.name'),
            defaultMessage: `Media Library`
        }),
        subtitle: breadcrumbs && typeof breadcrumbs !== 'boolean' && folder && /*#__PURE__*/ jsx(Breadcrumbs, {
            label: formatMessage({
                id: getTrad('header.breadcrumbs.nav.label'),
                defaultMessage: 'Folders navigation'
            }),
            breadcrumbs: breadcrumbs,
            currentFolderId: folder?.id
        }),
        navigationAction: folder && /*#__PURE__*/ jsx(Link, {
            tag: NavLink,
            startIcon: /*#__PURE__*/ jsx(ArrowLeft, {}),
            to: `${pathname}?${stringify(backQuery, {
                encode: false
            })}`,
            children: formatMessage({
                id: getTrad('header.actions.folder-level-up'),
                defaultMessage: 'Back'
            })
        }),
        primaryAction: canCreate && /*#__PURE__*/ jsxs(Flex, {
            gap: 2,
            children: [
                /*#__PURE__*/ jsx(Button, {
                    startIcon: /*#__PURE__*/ jsx(Plus, {}),
                    variant: "secondary",
                    onClick: onToggleEditFolderDialog,
                    children: formatMessage({
                        id: getTrad('header.actions.add-folder'),
                        defaultMessage: 'Add new folder'
                    })
                }),
                /*#__PURE__*/ jsx(Button, {
                    startIcon: /*#__PURE__*/ jsx(Plus, {}),
                    onClick: onToggleUploadAssetDialog,
                    children: formatMessage({
                        id: getTrad('header.actions.add-assets'),
                        defaultMessage: 'Add new assets'
                    })
                })
            ]
        })
    });
};

export { Header };
//# sourceMappingURL=Header.mjs.map
