'use strict';

var immer = require('immer');
var get = require('lodash/get');
var set = require('lodash/set');
var actionTypes = require('./actionTypes.js');
var init = require('./init.js');

const reducer = (state = init.initialState, action = {
    type: ''
})=>// eslint-disable-next-line consistent-return
    immer.produce(state, (draftState)=>{
        switch(action.type){
            case actionTypes.ON_CHANGE:
                {
                    if ('keys' in action && 'value' in action && action.keys) {
                        set(draftState, [
                            'modifiedData',
                            ...action.keys.split('.')
                        ], action.value);
                    }
                    break;
                }
            case actionTypes.SET_LOADED:
                {
                    // This action re-initialises the state using the current modifiedData.
                    const reInitialise = init.init(get(draftState, [
                        'modifiedData'
                    ], {}));
                    draftState.initialData = reInitialise.initialData;
                    draftState.modifiedData = reInitialise.modifiedData;
                    break;
                }
            default:
                return draftState;
        }
    });

exports.reducer = reducer;
//# sourceMappingURL=reducer.js.map
