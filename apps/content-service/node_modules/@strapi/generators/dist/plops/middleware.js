'use strict';

var tsUtils = require('@strapi/typescript-utils');
var getDestinationPrompts = require('./prompts/get-destination-prompts.js');
var validateInput = require('./utils/validate-input.js');
var getFilePath = require('./utils/get-file-path.js');

var generateMiddleware = ((plop)=>{
    // middleware generator
    plop.setGenerator('middleware', {
        description: 'Generate a middleware for an API',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'Middleware name',
                validate: (input)=>validateInput(input)
            },
            ...getDestinationPrompts('middleware', plop.getDestBasePath(), {
                rootFolder: true
            })
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
                    path: `${filePath}/middlewares/{{ name }}.${language}`,
                    templateFile: `templates/${language}/middleware.${language}.hbs`
                }
            ];
        }
    });
});

module.exports = generateMiddleware;
//# sourceMappingURL=middleware.js.map
