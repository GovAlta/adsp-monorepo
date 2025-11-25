import tsUtils from '@strapi/typescript-utils';
import getDestinationPrompts from './prompts/get-destination-prompts.mjs';
import validateInput from './utils/validate-input.mjs';
import getFilePath from './utils/get-file-path.mjs';

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

export { generatePolicy as default };
//# sourceMappingURL=policy.mjs.map
