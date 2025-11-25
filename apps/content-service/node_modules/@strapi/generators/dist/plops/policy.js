'use strict';

var tsUtils = require('@strapi/typescript-utils');
var getDestinationPrompts = require('./prompts/get-destination-prompts.js');
var validateInput = require('./utils/validate-input.js');
var getFilePath = require('./utils/get-file-path.js');

var generatePolicy = ((plop)=>{
    // Policy generator
    plop.setGenerator('policy', {
        description: 'Generate a policy for an API',
        prompts: [
            {
                type: 'input',
                name: 'id',
                message: 'Policy name',
                validate: (input)=>validateInput(input)
            },
            ...getDestinationPrompts('policy', plop.getDestBasePath(), {
                rootFolder: true
            })
        ],
        actions (answers) {
            if (!answers) {
                return [];
            }
            const currentDir = process.cwd();
            const filePath = getFilePath(answers.destination);
            const language = tsUtils.isUsingTypeScriptSync(currentDir) ? 'ts' : 'js';
            return [
                {
                    type: 'add',
                    path: `${filePath}/policies/{{ id }}.${language}`,
                    templateFile: `templates/${language}/policy.${language}.hbs`
                }
            ];
        }
    });
});

module.exports = generatePolicy;
//# sourceMappingURL=policy.js.map
