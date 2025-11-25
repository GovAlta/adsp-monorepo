'use strict';

var tsUtils = require('@strapi/typescript-utils');
var getDestinationPrompts = require('./prompts/get-destination-prompts.js');
var getFilePath = require('./utils/get-file-path.js');

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

module.exports = generateService;
//# sourceMappingURL=service.js.map
