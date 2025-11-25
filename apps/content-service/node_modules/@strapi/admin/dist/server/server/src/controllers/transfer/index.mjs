import { mapKeys } from 'lodash/fp';
import runner from './runner.mjs';
import token from './token.mjs';

const prefixActionsName = (prefix, dict)=>mapKeys((key)=>`${prefix}-${key}`, dict);
var transfer = {
    ...prefixActionsName('runner', runner),
    ...prefixActionsName('token', token)
};

export { transfer as default };
//# sourceMappingURL=index.mjs.map
