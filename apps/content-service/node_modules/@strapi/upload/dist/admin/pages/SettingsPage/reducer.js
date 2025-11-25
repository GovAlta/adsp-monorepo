'use strict';

var immer = require('immer');
var set = require('lodash/set');

const initialData = {
    responsiveDimensions: true,
    sizeOptimization: true,
    autoOrientation: false,
    videoPreview: false,
    aiMetadata: true
};
const initialState = {
    initialData,
    modifiedData: {
        ...initialData
    }
};
const reducer = (state, action)=>immer.produce(state, (drafState)=>{
        switch(action.type){
            case 'GET_DATA_SUCCEEDED':
                {
                    drafState.initialData = action.data;
                    drafState.modifiedData = action.data;
                    break;
                }
            case 'ON_CHANGE':
                {
                    set(drafState, [
                        'modifiedData',
                        ...action.keys.split('.')
                    ], action.value);
                    break;
                }
            default:
                return state;
        }
    });

exports.initialState = initialState;
exports.reducer = reducer;
//# sourceMappingURL=reducer.js.map
