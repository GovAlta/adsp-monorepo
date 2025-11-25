import i18nActionsService from './permissions/actions.mjs';
import sectionsBuilderService from './permissions/sections-builder.mjs';
import engineService from './permissions/engine.mjs';

const permissions = ()=>({
        actions: i18nActionsService,
        sectionsBuilder: sectionsBuilderService,
        engine: engineService
    });

export { permissions as default };
//# sourceMappingURL=permissions.mjs.map
