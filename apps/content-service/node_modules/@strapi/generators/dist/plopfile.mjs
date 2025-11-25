import pluralize from 'pluralize';
import generateApi from './plops/api.mjs';
import generateController from './plops/controller.mjs';
import generateContentType from './plops/content-type.mjs';
import generatePolicy from './plops/policy.mjs';
import generateMiddleware from './plops/middleware.mjs';
import generateMigration from './plops/migration.mjs';
import generateService from './plops/service.mjs';

var plopfile = ((plop)=>{
    // Plop config
    plop.setWelcomeMessage('Strapi Generators');
    plop.setHelper('pluralize', (text)=>pluralize(text));
    // Generators
    generateApi(plop);
    generateController(plop);
    generateContentType(plop);
    generatePolicy(plop);
    generateMiddleware(plop);
    generateMigration(plop);
    generateService(plop);
});

export { plopfile as default };
//# sourceMappingURL=plopfile.mjs.map
