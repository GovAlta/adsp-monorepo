"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMergedTypeValueVariable = isMergedTypeValueVariable;
exports.isTypeOnlyReference = isTypeOnlyReference;
const scope_manager_1 = require("@typescript-eslint/scope-manager");
const referenceContainsTypePredicate_1 = require("./referenceContainsTypePredicate");
const referenceContainsTypeQuery_1 = require("./referenceContainsTypeQuery");
function isMergedTypeValueVariable(variable) {
    return ('isTypeVariable' in variable &&
        'isValueVariable' in variable &&
        variable.isTypeVariable &&
        variable.isValueVariable);
}
function isTypeOnlyReference(variable, ref) {
    if ((0, referenceContainsTypeQuery_1.referenceContainsTypeQuery)(ref.identifier) ||
        (0, referenceContainsTypePredicate_1.referenceContainsTypePredicate)(ref.identifier)) {
        return true;
    }
    return (variable.defs.some(def => def.type === scope_manager_1.DefinitionType.Variable) &&
        !ref.isValueReference);
}
//# sourceMappingURL=isTypeOnlyReference.js.map