import * as React from 'react';
import sortBy from 'lodash/sortBy';
import { useSelector } from 'react-redux';
import { SETTINGS_LINKS_CE } from '../constants.mjs';
import { useAppInfo } from '../features/AppInfo.mjs';
import { useAuth } from '../features/Auth.mjs';
import { useStrapiApp } from '../features/StrapiApp.mjs';
import { selectAdminPermissions } from '../selectors.mjs';
import { useEnterprise } from './useEnterprise.mjs';

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
    const [{ isLoading, menu }, setData] = React.useState({
        isLoading: true,
        menu: []
    });
    const checkUserHasPermission = useAuth('useSettingsMenu', (state)=>state.checkUserHasPermissions);
    const shouldUpdateStrapi = useAppInfo('useSettingsMenu', (state)=>state.shouldUpdateStrapi);
    const settings = useStrapiApp('useSettingsMenu', (state)=>state.settings);
    const permissions = useSelector(selectAdminPermissions);
    /**
   * memoize the return value of this function to avoid re-computing it on every render
   * because it's used in an effect it ends up re-running recursively.
   */ const ceLinks = React.useMemo(()=>SETTINGS_LINKS_CE(), []);
    const { admin: adminLinks, global: globalLinks } = useEnterprise(ceLinks, async ()=>(await import('../../../ee/admin/src/constants.mjs')).SETTINGS_LINKS_EE(), {
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
    const addPermissions = React.useCallback((link)=>{
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
    React.useEffect(()=>{
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

export { useSettingsMenu };
//# sourceMappingURL=useSettingsMenu.mjs.map
