'use strict';

var validateInput = require('../utils/validate-input.js');

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

module.exports = questions;
//# sourceMappingURL=kind-prompts.js.map
