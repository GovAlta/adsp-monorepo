'use strict';

var pluralize = require('pluralize');
var slugify = require('@sindresorhus/slugify');
var utils = require('@strapi/utils');

const questions = [
    {
        type: 'input',
        name: 'displayName',
        message: 'Content type display name',
        validate: (input)=>!!input
    },
    {
        type: 'input',
        name: 'singularName',
        message: 'Content type singular name',
        default: (answers)=>slugify(answers.displayName),
        validate (input) {
            if (!utils.strings.isKebabCase(input)) {
                return 'Value must be in kebab-case';
            }
            return true;
        }
    },
    {
        type: 'input',
        name: 'pluralName',
        message: 'Content type plural name',
        default: (answers)=>pluralize(answers.singularName),
        validate (input, answers) {
            if (answers.singularName === input) {
                return 'Singular and plural names cannot be the same';
            }
            if (!utils.strings.isKebabCase(input)) {
                return 'Value must be in kebab-case';
            }
            return true;
        }
    }
];

module.exports = questions;
//# sourceMappingURL=ct-names-prompts.js.map
