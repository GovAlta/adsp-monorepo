'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');

const componentStore = new Map();
/**
 * @description A hook to lazy load custom field components
 */ const useLazyComponents = (componentUids = [])=>{
    const [lazyComponentStore, setLazyComponentStore] = React.useState(Object.fromEntries(componentStore));
    /**
   * Start loading only if there are any components passed in
   * and there are some new to load
   */ const newUids = componentUids.filter((uid)=>!componentStore.get(uid));
    const [loading, setLoading] = React.useState(()=>!!newUids.length);
    const getCustomField = strapiAdmin.useStrapiApp('useLazyComponents', (state)=>state.customFields.get);
    React.useEffect(()=>{
        const setStore = (store)=>{
            setLazyComponentStore(store);
            setLoading(false);
        };
        const lazyLoadComponents = async (uids, components)=>{
            const modules = await Promise.all(components);
            uids.forEach((uid, index)=>{
                componentStore.set(uid, modules[index].default);
            });
            setStore(Object.fromEntries(componentStore));
        };
        if (newUids.length > 0) {
            setLoading(true);
            const componentPromises = newUids.reduce((arrayOfPromises, uid)=>{
                const customField = getCustomField(uid);
                if (customField) {
                    arrayOfPromises.push(customField.components.Input());
                }
                return arrayOfPromises;
            }, []);
            if (componentPromises.length > 0) {
                lazyLoadComponents(newUids, componentPromises);
            }
        }
    }, [
        newUids,
        getCustomField
    ]);
    /**
   * Wrap this in a callback so it can be used in
   * effects to cleanup the cached store if required
   */ const cleanup = React.useCallback(()=>{
        componentStore.clear();
        setLazyComponentStore({});
    }, []);
    return {
        isLazyLoading: loading,
        lazyComponentStore,
        cleanup
    };
};

exports.useLazyComponents = useLazyComponents;
//# sourceMappingURL=useLazyComponents.js.map
