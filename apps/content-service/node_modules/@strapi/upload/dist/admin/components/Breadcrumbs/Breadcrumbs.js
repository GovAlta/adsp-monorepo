'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var CrumbSimpleMenuAsync = require('./CrumbSimpleMenuAsync.js');

const Breadcrumbs = ({ breadcrumbs, onChangeFolder, currentFolderId, ...props })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Breadcrumbs, {
        ...props,
        children: breadcrumbs.map((crumb, index)=>{
            if (Array.isArray(crumb)) {
                return /*#__PURE__*/ jsxRuntime.jsx(CrumbSimpleMenuAsync.CrumbSimpleMenuAsync, {
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
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.CrumbLink, {
                        type: "button",
                        onClick: ()=>onChangeFolder(crumb.id, crumb.path),
                        children: typeof crumb.label !== 'string' && crumb.label?.id ? formatMessage(crumb.label) : crumb.label
                    }, `breadcrumb-${crumb?.id ?? 'root'}`);
                }
                return /*#__PURE__*/ jsxRuntime.jsx(designSystem.CrumbLink, {
                    to: crumb.href,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore - `tag` prop is not defined in the `BaseLinkProps` type
                    tag: reactRouterDom.Link,
                    children: typeof crumb.label !== 'string' && crumb.label?.id ? formatMessage(crumb.label) : crumb.label
                }, `breadcrumb-${crumb?.id ?? 'root'}`);
            }
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Crumb, {
                isCurrent: index + 1 === breadcrumbs.length,
                children: typeof crumb.label !== 'string' && crumb.label?.id ? formatMessage(crumb.label) : crumb.label
            }, `breadcrumb-${crumb?.id ?? 'root'}`);
        })
    });
};

exports.Breadcrumbs = Breadcrumbs;
//# sourceMappingURL=Breadcrumbs.js.map
