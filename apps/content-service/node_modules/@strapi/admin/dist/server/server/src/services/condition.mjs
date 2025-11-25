import { isString } from 'lodash/fp';
import { getService } from '../utils/index.mjs';

const isValidCondition = (condition)=>{
    const { conditionProvider } = getService('permission');
    return isString(condition) && conditionProvider.has(condition);
};

export { isValidCondition };
//# sourceMappingURL=condition.mjs.map
