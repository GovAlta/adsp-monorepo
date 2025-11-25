'use strict';

var React = require('react');
var icons = require('@strapi/icons');
var cloneDeep = require('lodash/cloneDeep');
var hooks = require('../core/store/hooks.js');
var Auth = require('../features/Auth.js');
var StrapiApp = require('../features/StrapiApp.js');

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

const useMenu = (shouldUpdateStrapi)=>{
    const checkUserHasPermissions = Auth.useAuth('useMenu', (state)=>state.checkUserHasPermissions);
    const menu = StrapiApp.useStrapiApp('useMenu', (state)=>state.menu);
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions);
    const [menuWithUserPermissions, setMenuWithUserPermissions] = React__namespace.useState({
        generalSectionLinks: [
            {
                icon: icons.House,
                intlLabel: {
                    id: 'global.home',
                    defaultMessage: 'Home'
                },
                to: '/',
                permissions: [],
                position: 0
            },
            {
                icon: icons.ShoppingCart,
                intlLabel: {
                    id: 'global.marketplace',
                    defaultMessage: 'Marketplace'
                },
                to: '/marketplace',
                permissions: permissions.marketplace?.main ?? [],
                position: 7
            },
            {
                icon: icons.Cog,
                intlLabel: {
                    id: 'global.settings',
                    defaultMessage: 'Settings'
                },
                to: '/settings',
                // Permissions of this link are retrieved in the init phase
                // using the settings menu
                permissions: [],
                notificationsCount: 0,
                position: 9
            }
        ],
        pluginsSectionLinks: [],
        topMobileNavigation: [
            {
                to: '/'
            },
            {
                to: 'content-manager'
            },
            {
                to: 'plugins/content-releases'
            },
            {
                to: 'plugins/upload'
            }
        ],
        burgerMobileNavigation: [
            {
                to: '/settings'
            }
        ],
        isLoading: true
    });
    const generalSectionLinksRef = React__namespace.useRef(menuWithUserPermissions.generalSectionLinks);
    React__namespace.useEffect(()=>{
        async function applyMenuPermissions() {
            const authorizedPluginSectionLinks = await getPluginSectionLinks(menu, checkUserHasPermissions);
            const authorizedGeneralSectionLinks = await getGeneralLinks(generalSectionLinksRef.current, shouldUpdateStrapi, checkUserHasPermissions);
            setMenuWithUserPermissions((state)=>({
                    ...state,
                    generalSectionLinks: authorizedGeneralSectionLinks,
                    pluginsSectionLinks: authorizedPluginSectionLinks,
                    isLoading: false
                }));
        }
        applyMenuPermissions();
    }, [
        setMenuWithUserPermissions,
        generalSectionLinksRef,
        menu,
        permissions,
        shouldUpdateStrapi,
        checkUserHasPermissions
    ]);
    return menuWithUserPermissions;
};
/* -------------------------------------------------------------------------------------------------
 * Utils
 * -----------------------------------------------------------------------------------------------*/ const getGeneralLinks = async (generalSectionRawLinks, shouldUpdateStrapi = false, checkUserHasPermissions)=>{
    const generalSectionLinksPermissions = await Promise.all(generalSectionRawLinks.map(({ permissions })=>checkUserHasPermissions(permissions)));
    const authorizedGeneralSectionLinks = generalSectionRawLinks.filter((_, index)=>generalSectionLinksPermissions[index].length > 0);
    const settingsLinkIndex = authorizedGeneralSectionLinks.findIndex((obj)=>obj.to === '/settings');
    if (settingsLinkIndex === -1) {
        return [];
    }
    const authorizedGeneralLinksClone = cloneDeep(authorizedGeneralSectionLinks);
    authorizedGeneralLinksClone[settingsLinkIndex].notificationsCount = shouldUpdateStrapi ? 1 : 0;
    return authorizedGeneralLinksClone;
};
const getPluginSectionLinks = async (pluginsSectionRawLinks, checkUserHasPermissions)=>{
    const pluginSectionLinksPermissions = await Promise.all(pluginsSectionRawLinks.map(({ permissions })=>checkUserHasPermissions(permissions)));
    const authorizedPluginSectionLinks = pluginsSectionRawLinks.filter((_, index)=>pluginSectionLinksPermissions[index].length > 0);
    return authorizedPluginSectionLinks;
};

exports.useMenu = useMenu;
//# sourceMappingURL=useMenu.js.map
