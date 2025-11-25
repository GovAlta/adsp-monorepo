'use strict';

var tsUtils = require('@strapi/typescript-utils');
var getDestinationPrompts = require('./prompts/get-destination-prompts.js');
var getFilePath = require('./utils/get-file-path.js');
var validateInput = require('./utils/validate-input.js');

var generateController = ((plop)=>{
    // Controller generator
    plop.setGenerator('controller', {
        description: 'Generate a controller for an API',
        prompts: [
            {
                type: 'input',
                name: 'id',
                message: 'Controller name',
                validate: (input)=>validateInput(input)
            },
            ...getDestinationPrompts('controller', plop.getDestBasePath())
        ],
        actions (answers) {
            if (!answers) {
                return [];
            }
            const filePath = getFilePath(answers.destination);
            const currentDir = process.cwd();
            const language = tsUtils.isUsingTypeScriptSync(currentDir) ? 'ts' : 'js';
            return [
                {
                    type: 'add',
                    path: `${filePath}/controllers/{{ id }}.${language}`,
                    templateFile: `templates/${language}/controller.${language}.hbs`
                }
            ];
        }
    });
});

module.exports = generateController;
//# sourceMappingURL=controller.js.map
