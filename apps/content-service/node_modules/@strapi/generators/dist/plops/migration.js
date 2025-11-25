'use strict';

var tsUtils = require('@strapi/typescript-utils');
var validateFileNameInput = require('./utils/validate-file-name-input.js');
var getFormattedDate = require('./utils/get-formatted-date.js');

var generateMigration = ((plop)=>{
    // Migration generator
    plop.setGenerator('migration', {
        description: 'Generate a migration',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'Migration name',
                validate: (input)=>validateFileNameInput(input)
            }
        ],
        actions () {
            const currentDir = process.cwd();
            const language = tsUtils.isUsingTypeScriptSync(currentDir) ? 'ts' : 'js';
            const timestamp = getFormattedDate();
            return [
                {
                    type: 'add',
                    path: `${currentDir}/database/migrations/${timestamp}.{{ name }}.${language}`,
                    templateFile: `templates/${language}/migration.${language}.hbs`
                }
            ];
        }
    });
});

module.exports = generateMigration;
//# sourceMappingURL=migration.js.map
