import permissionDomain from '../domain/permission/index.mjs';
import createActionProvider from '../domain/action/provider.mjs';
import createConditionProvider from '../domain/condition/provider.mjs';
export { default as createPermissionsManager } from './permission/permissions-manager/index.mjs';
import createPermissionEngine from './permission/engine.mjs';
import createDefaultSectionBuilder from './permission/sections-builder/index.mjs';
export { cleanPermissionsInDatabase, createMany, deleteByIds, deleteByRolesIds, findMany, findUserPermissions } from './permission/queries.mjs';

const actionProvider = createActionProvider();
const conditionProvider = createConditionProvider();
const sectionsBuilder = createDefaultSectionBuilder();
const sanitizePermission = permissionDomain.sanitizePermissionFields;
const engine = createPermissionEngine({
    providers: {
        action: actionProvider,
        condition: conditionProvider
    }
});

export { actionProvider, conditionProvider, engine, sanitizePermission, sectionsBuilder };
//# sourceMappingURL=permission.mjs.map
