'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var plugin = require('../constants/plugin.js');

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
    return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
        children: components.map((component)=>/*#__PURE__*/ jsxRuntime.jsx(component.Component, {
                ...props
            }, component.name))
    });
};
const useInjectionZone = (area)=>{
    const getPlugin = strapiAdmin.useStrapiApp('useInjectionZone', (state)=>state.getPlugin);
    const contentManagerPlugin = getPlugin(plugin.PLUGIN_ID);
    const [page, position] = area.split('.');
    return contentManagerPlugin.getInjectedComponents(page, position);
};

exports.INJECTION_ZONES = INJECTION_ZONES;
exports.InjectionZone = InjectionZone;
exports.useInjectionZone = useInjectionZone;
//# sourceMappingURL=InjectionZone.js.map
