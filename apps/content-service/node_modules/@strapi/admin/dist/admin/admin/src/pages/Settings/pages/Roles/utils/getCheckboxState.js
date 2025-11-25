'use strict';

var createArrayOfValues = require('./createArrayOfValues.js');
var removeConditionKeyFromData = require('./removeConditionKeyFromData.js');

const getCheckboxState = (dataObj)=>{
    const dataWithoutCondition = removeConditionKeyFromData.removeConditionKeyFromData(dataObj);
    const arrayOfValues = createArrayOfValues.createArrayOfValues(dataWithoutCondition);
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

exports.getCheckboxState = getCheckboxState;
//# sourceMappingURL=getCheckboxState.js.map
