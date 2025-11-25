import tsUtils from '@strapi/typescript-utils';
import getDestinationPrompts from './prompts/get-destination-prompts.mjs';
import getFilePath from './utils/get-file-path.mjs';

var generateService = ((plop)=>{
    // Service generator
    plop.setGenerator('service', {
        description: 'Generate a service for an API',
        prompts: [
            {
                type: 'input',
                name: 'id',
                message: 'Service name'
            },
            ...getDestinationPrompts('service', plop.getDestBasePath())
        ],
        actions (answers) {
            if (!answers) {
                return [];
            }
            const filePath = getFilePath(answers?.destination);
            const currentDir = process.cwd();
            const language = tsUtils.isUsingTypeScriptSync(currentDir) ? 'ts' : 'js';
            return [
                {
                    type: 'add',
                    path: `${filePath}/services/{{ id }}.${language}`,
                    templateFile: `templates/${language}/service.${language}.hbs`
                }
            ];
        }
    });
});

export { generateService as default };
//# sourceMappingURL=service.mjs.map
