import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useQueryParams } from '@strapi/admin/strapi-admin';
import { CrumbSimpleMenu, MenuItem, Loader } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { useFolderStructure } from '../../hooks/useFolderStructure.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../utils/getTrad.mjs';
import { getFolderURL } from '../../utils/getFolderURL.mjs';
import { getFolderParents } from '../../utils/getFolderParents.mjs';
import '../../constants.mjs';
import '../../utils/urlYupSchema.mjs';

const CrumbSimpleMenuAsync = ({ parentsToOmit = [], currentFolderId, onChangeFolder })=>{
    const [shouldFetch, setShouldFetch] = React.useState(false);
    const { data, isLoading } = useFolderStructure({
        enabled: shouldFetch
    });
    const { pathname } = useLocation();
    const [{ query }] = useQueryParams();
    const { formatMessage } = useIntl();
    const allAscendants = data && getFolderParents(data, currentFolderId);
    const filteredAscendants = allAscendants && allAscendants.filter((ascendant)=>typeof ascendant.id === 'number' && !parentsToOmit.includes(ascendant.id) && ascendant.id !== null);
    return /*#__PURE__*/ jsxs(CrumbSimpleMenu, {
        onOpen: ()=>setShouldFetch(true),
        onClose: ()=>setShouldFetch(false),
        "aria-label": formatMessage({
            id: getTrad('header.breadcrumbs.menu.label'),
            defaultMessage: 'Get more ascendants folders'
        }),
        label: "...",
        children: [
            isLoading && /*#__PURE__*/ jsx(MenuItem, {
                children: /*#__PURE__*/ jsx(Loader, {
                    small: true,
                    children: formatMessage({
                        id: getTrad('content.isLoading'),
                        defaultMessage: 'Content is loading.'
                    })
                })
            }),
            filteredAscendants && filteredAscendants.map((ascendant)=>{
                if (onChangeFolder) {
                    return /*#__PURE__*/ jsx(MenuItem, {
                        tag: "button",
                        type: "button",
                        onClick: ()=>onChangeFolder(Number(ascendant.id), ascendant.path),
                        children: ascendant.label
                    }, ascendant.id);
                }
                const url = getFolderURL(pathname, query, {
                    folder: typeof ascendant?.id === 'string' ? ascendant.id : undefined,
                    folderPath: ascendant?.path
                });
                return /*#__PURE__*/ jsx(MenuItem, {
                    isLink: true,
                    href: url,
                    children: ascendant.label
                }, ascendant.id);
            })
        ]
    });
};

export { CrumbSimpleMenuAsync };
//# sourceMappingURL=CrumbSimpleMenuAsync.mjs.map
