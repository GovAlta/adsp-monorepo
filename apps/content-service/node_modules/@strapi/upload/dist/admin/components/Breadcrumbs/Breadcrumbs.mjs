import { jsx } from 'react/jsx-runtime';
import { Breadcrumbs as Breadcrumbs$1, CrumbLink, Crumb } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { CrumbSimpleMenuAsync } from './CrumbSimpleMenuAsync.mjs';

const Breadcrumbs = ({ breadcrumbs, onChangeFolder, currentFolderId, ...props })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Breadcrumbs$1, {
        ...props,
        children: breadcrumbs.map((crumb, index)=>{
            if (Array.isArray(crumb)) {
                return /*#__PURE__*/ jsx(CrumbSimpleMenuAsync, {
                    parentsToOmit: [
                        ...breadcrumbs
                    ].splice(index + 1, breadcrumbs.length - 1).map((parent)=>parent.id),
                    currentFolderId: currentFolderId,
                    onChangeFolder: onChangeFolder
                }, `breadcrumb-${crumb?.id ?? 'menu'}`);
            }
            const isCurrentFolderMediaLibrary = crumb.id === null && currentFolderId === undefined;
            if (currentFolderId !== crumb.id && !isCurrentFolderMediaLibrary) {
                if (onChangeFolder) {
                    return /*#__PURE__*/ jsx(CrumbLink, {
                        type: "button",
                        onClick: ()=>onChangeFolder(crumb.id, crumb.path),
                        children: typeof crumb.label !== 'string' && crumb.label?.id ? formatMessage(crumb.label) : crumb.label
                    }, `breadcrumb-${crumb?.id ?? 'root'}`);
                }
                return /*#__PURE__*/ jsx(CrumbLink, {
                    to: crumb.href,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore - `tag` prop is not defined in the `BaseLinkProps` type
                    tag: Link,
                    children: typeof crumb.label !== 'string' && crumb.label?.id ? formatMessage(crumb.label) : crumb.label
                }, `breadcrumb-${crumb?.id ?? 'root'}`);
            }
            return /*#__PURE__*/ jsx(Crumb, {
                isCurrent: index + 1 === breadcrumbs.length,
                children: typeof crumb.label !== 'string' && crumb.label?.id ? formatMessage(crumb.label) : crumb.label
            }, `breadcrumb-${crumb?.id ?? 'root'}`);
        })
    });
};

export { Breadcrumbs };
//# sourceMappingURL=Breadcrumbs.mjs.map
