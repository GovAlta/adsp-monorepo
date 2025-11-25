import { createArrayOfValues } from './createArrayOfValues.mjs';
import { removeConditionKeyFromData } from './removeConditionKeyFromData.mjs';

const getCheckboxState = (dataObj)=>{
    const dataWithoutCondition = removeConditionKeyFromData(dataObj);
    const arrayOfValues = createArrayOfValues(dataWithoutCondition);
    if (!arrayOfValues.length) {
        return {
            hasAllActionsSelected: false,
            hasSomeActionsSelected: false
        };
    }
    const hasAllActionsSelected = arrayOfValues.every((val)=>val);
    const hasSomeActionsSelected = arrayOfValues.some((val)=>val) && !hasAllActionsSelected;
    return {
        hasAllActionsSelected,
        hasSomeActionsSelected
    };
};

export { getCheckboxState };
//# sourceMappingURL=getCheckboxState.mjs.map
