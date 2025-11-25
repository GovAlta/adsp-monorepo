'use strict';

var React = require('react');
var sortBy = require('lodash/sortBy');
var reactRedux = require('react-redux');
var constants = require('../constants.js');
var AppInfo = require('../features/AppInfo.js');
var Auth = require('../features/Auth.js');
var StrapiApp = require('../features/StrapiApp.js');
var selectors = require('../selectors.js');
var useEnterprise = require('./useEnterprise.js');

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

const formatLinks = (menu)=>menu.map((menuSection)=>{
        const formattedLinks = menuSection.links.map((link)=>({
                ...link,
                isDisplayed: false
            }));
        return {
            ...menuSection,
            links: formattedLinks
        };
    });
const useSettingsMenu = ()=>{
    const [{ isLoading, menu }, setData] = React__namespace.useState({
        isLoading: true,
        menu: []
    });
    const checkUserHasPermission = Auth.useAuth('useSettingsMenu', (state)=>state.checkUserHasPermissions);
    const shouldUpdateStrapi = AppInfo.useAppInfo('useSettingsMenu', (state)=>state.shouldUpdateStrapi);
    const settings = StrapiApp.useStrapiApp('useSettingsMenu', (state)=>state.settings);
    const permissions = reactRedux.useSelector(selectors.selectAdminPermissions);
    /**
   * memoize the return value of this function to avoid re-computing it on every render
   * because it's used in an effect it ends up re-running recursively.
   */ const ceLinks = React__namespace.useMemo(()=>constants.SETTINGS_LINKS_CE(), []);
    const { admin: adminLinks, global: globalLinks } = useEnterprise.useEnterprise(ceLinks, async ()=>(await Promise.resolve().then(function () { return require('../../../ee/admin/src/constants.js'); })).SETTINGS_LINKS_EE(), {
        combine (ceLinks, eeLinks) {
            return {
                admin: [
                    ...eeLinks.admin,
                    ...ceLinks.admin
                ],
                global: [
                    ...ceLinks.global,
                    ...eeLinks.global
                ]
            };
        },
        defaultValue: {
            admin: [],
            global: []
        }
    });
    const addPermissions = React__namespace.useCallback((link)=>{
        if (!link.id) {
            throw new Error('The settings menu item must have an id attribute.');
        }
        return {
            ...link,
            permissions: permissions.settings?.[link.id]?.main ?? []
        };
    }, [
        permissions.settings
    ]);
    React__namespace.useEffect(()=>{
        const getData = async ()=>{
            const buildMenuPermissions = (sections)=>Promise.all(sections.reduce((acc, section, sectionIndex)=>{
                    const linksWithPermissions = section.links.map(async (link, linkIndex)=>({
                            hasPermission: (await checkUserHasPermission(link.permissions)).length > 0,
                            sectionIndex,
                            linkIndex
                        }));
                    return [
                        ...acc,
                        ...linksWithPermissions
                    ];
                }, []));
            const menuPermissions = await buildMenuPermissions(sections);
            setData((prev)=>{
                return {
                    ...prev,
                    isLoading: false,
                    menu: sections.map((section, sectionIndex)=>({
                            ...section,
                            links: section.links.map((link, linkIndex)=>{
                                const permission = menuPermissions.find((permission)=>permission.sectionIndex === sectionIndex && permission.linkIndex === linkIndex);
                                return {
                                    ...link,
                                    isDisplayed: Boolean(permission?.hasPermission)
                                };
                            })
                        }))
                };
            });
        };
        const { global, ...otherSections } = settings;
        const sections = formatLinks([
            {
                ...global,
                links: sortBy([
                    ...global.links,
                    ...globalLinks.map(addPermissions)
                ], (link)=>link.id).map((link)=>({
                        ...link,
                        hasNotification: link.id === '000-application-infos' && shouldUpdateStrapi
                    }))
            },
            {
                id: 'permissions',
                intlLabel: {
                    id: 'Settings.permissions',
                    defaultMessage: 'Administration Panel'
                },
                links: adminLinks.map(addPermissions)
            },
            ...Object.values(otherSections)
        ]);
        getData();
    }, [
        adminLinks,
        globalLinks,
        settings,
        shouldUpdateStrapi,
        addPermissions,
        checkUserHasPermission
    ]);
    return {
        isLoading,
        menu: menu.map((menuItem)=>({
                ...menuItem,
                links: menuItem.links.filter((link)=>link.isDisplayed)
            }))
    };
};

exports.useSettingsMenu = useSettingsMenu;
//# sourceMappingURL=useSettingsMenu.js.map
