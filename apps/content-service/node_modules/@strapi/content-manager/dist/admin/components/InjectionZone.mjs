import { jsx, Fragment } from 'react/jsx-runtime';
import { useStrapiApp } from '@strapi/admin/strapi-admin';
import { PLUGIN_ID } from '../constants/plugin.mjs';

const INJECTION_ZONES = {
    editView: {
        informations: [],
        'right-links': []
    },
    listView: {
        actions: [],
        deleteModalAdditionalInfos: [],
        publishModalAdditionalInfos: [],
        unpublishModalAdditionalInfos: []
    },
    preview: {
        actions: []
    }
};
/**
 * You can't know what this component props will be because it's generic and used everywhere
 * e.g. content-manager edit view, we just send the slug but we might not in the listView,
 * therefore, people should type it themselves on the components they render.
 */ const InjectionZone = ({ area, ...props })=>{
    const components = useInjectionZone(area);
    return /*#__PURE__*/ jsx(Fragment, {
        children: components.map((component)=>/*#__PURE__*/ jsx(component.Component, {
                ...props
            }, component.name))
    });
};
const useInjectionZone = (area)=>{
    const getPlugin = useStrapiApp('useInjectionZone', (state)=>state.getPlugin);
    const contentManagerPlugin = getPlugin(PLUGIN_ID);
    const [page, position] = area.split('.');
    return contentManagerPlugin.getInjectedComponents(page, position);
};

export { INJECTION_ZONES, InjectionZone, useInjectionZone };
//# sourceMappingURL=InjectionZone.mjs.map
