import validateInput from '../utils/validate-input.mjs';

const questions = [
    {
        type: 'list',
        name: 'kind',
        message: 'Please choose the model type',
        default: 'collectionType',
        choices: [
            {
                name: 'Collection Type',
                value: 'collectionType'
            },
            {
                name: 'Single Type',
                value: 'singleType'
            }
        ],
        validate: (input)=>validateInput(input)
    }
];

export { questions as default };
//# sourceMappingURL=kind-prompts.mjs.map
