import * as React from 'react';
import { useAuth } from '@strapi/admin/strapi-admin';
import { unstable_useDocument } from '@strapi/content-manager/strapi-admin';
import { useParams } from 'react-router-dom';
import { doesPluginOptionsHaveI18nLocalized } from '../utils/fields.mjs';
import { capitalize } from '../utils/strings.mjs';

/**
 * @alpha
 * @description This hook is used to get the i18n status of a content type.
 * Also returns the CRUDP permission locale properties for the content type
 * so we know which locales the user can perform actions on.
 */ const useI18n = ()=>{
    // Extract the params from the URL to pass to our useDocument hook
    const params = useParams();
    const userPermissions = useAuth('useI18n', (state)=>state.permissions);
    const actions = React.useMemo(()=>{
        const permissions = userPermissions.filter((permission)=>permission.subject === params.slug);
        return permissions.reduce((acc, permission)=>{
            const [actionShorthand] = permission.action.split('.').slice(-1);
            return {
                ...acc,
                [`can${capitalize(actionShorthand)}`]: permission.properties?.locales ?? []
            };
        }, {
            canCreate: [],
            canRead: [],
            canUpdate: [],
            canDelete: [],
            canPublish: []
        });
    }, [
        params.slug,
        userPermissions
    ]);
    // TODO: use specific hook to get schema only
    const { schema } = unstable_useDocument({
        // We can non-null assert these because below we skip the query if they are not present
        collectionType: params.collectionType,
        model: params.slug
    }, {
        skip: true
    });
    if (doesPluginOptionsHaveI18nLocalized(schema?.pluginOptions)) {
        return {
            hasI18n: schema.pluginOptions.i18n.localized,
            ...actions
        };
    }
    return {
        hasI18n: false,
        ...actions
    };
};

export { useI18n };
//# sourceMappingURL=useI18n.mjs.map
