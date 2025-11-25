'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var useFolderStructure = require('../../hooks/useFolderStructure.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../utils/getTrad.js');
var getFolderURL = require('../../utils/getFolderURL.js');
var getFolderParents = require('../../utils/getFolderParents.js');
require('../../constants.js');
require('../../utils/urlYupSchema.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const CrumbSimpleMenuAsync = ({ parentsToOmit = [], currentFolderId, onChangeFolder })=>{
    const [shouldFetch, setShouldFetch] = React__namespace.useState(false);
    const { data, isLoading } = useFolderStructure.useFolderStructure({
        enabled: shouldFetch
    });
    const { pathname } = reactRouterDom.useLocation();
    const [{ query }] = strapiAdmin.useQueryParams();
    const { formatMessage } = reactIntl.useIntl();
    const allAscendants = data && getFolderParents.getFolderParents(data, currentFolderId);
    const filteredAscendants = allAscendants && allAscendants.filter((ascendant)=>typeof ascendant.id === 'number' && !parentsToOmit.includes(ascendant.id) && ascendant.id !== null);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.CrumbSimpleMenu, {
        onOpen: ()=>setShouldFetch(true),
        onClose: ()=>setShouldFetch(false),
        "aria-label": formatMessage({
            id: getTrad.getTrad('header.breadcrumbs.menu.label'),
            defaultMessage: 'Get more ascendants folders'
        }),
        label: "...",
        children: [
            isLoading && /*#__PURE__*/ jsxRuntime.jsx(designSystem.MenuItem, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Loader, {
                    small: true,
                    children: formatMessage({
                        id: getTrad.getTrad('content.isLoading'),
                        defaultMessage: 'Content is loading.'
                    })
                })
            }),
            filteredAscendants && filteredAscendants.map((ascendant)=>{
                if (onChangeFolder) {
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.MenuItem, {
                        tag: "button",
                        type: "button",
                        onClick: ()=>onChangeFolder(Number(ascendant.id), ascendant.path),
                        children: ascendant.label
                    }, ascendant.id);
                }
                const url = getFolderURL.getFolderURL(pathname, query, {
                    folder: typeof ascendant?.id === 'string' ? ascendant.id : undefined,
                    folderPath: ascendant?.path
                });
                return /*#__PURE__*/ jsxRuntime.jsx(designSystem.MenuItem, {
                    isLink: true,
                    href: url,
                    children: ascendant.label
                }, ascendant.id);
            })
        ]
    });
};

exports.CrumbSimpleMenuAsync = CrumbSimpleMenuAsync;
//# sourceMappingURL=CrumbSimpleMenuAsync.js.map
