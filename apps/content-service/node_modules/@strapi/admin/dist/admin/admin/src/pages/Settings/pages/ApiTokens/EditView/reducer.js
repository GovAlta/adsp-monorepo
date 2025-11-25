'use strict';

var immer = require('immer');
var pull = require('lodash/pull');
var transformPermissionsData = require('./utils/transformPermissionsData.js');

const initialState = {
    data: {
        allActionsIds: [],
        permissions: []
    },
    routes: {},
    selectedAction: '',
    selectedActions: []
};
const reducer = (state, action)=>immer.produce(state, (draftState)=>{
        switch(action.type){
            case 'ON_CHANGE':
                {
                    if (draftState.selectedActions.includes(action.value)) {
                        pull(draftState.selectedActions, action.value);
                    } else {
                        draftState.selectedActions.push(action.value);
                    }
                    break;
                }
            case 'SELECT_ALL_IN_PERMISSION':
                {
                    const areAllSelected = action.value.every((item)=>draftState.selectedActions.includes(item.actionId));
                    if (areAllSelected) {
                        action.value.forEach((item)=>{
                            pull(draftState.selectedActions, item.actionId);
                        });
                    } else {
                        action.value.forEach((item)=>{
                            draftState.selectedActions.push(item.actionId);
                        });
                    }
                    break;
                }
            case 'SELECT_ALL_ACTIONS':
                {
                    draftState.selectedActions = [
                        ...draftState.data.allActionsIds
                    ];
                    break;
                }
            case 'ON_CHANGE_READ_ONLY':
                {
                    const onlyReadOnlyActions = draftState.data.allActionsIds.filter((actionId)=>actionId.includes('find') || actionId.includes('findOne'));
                    draftState.selectedActions = [
                        ...onlyReadOnlyActions
                    ];
                    break;
                }
            case 'UPDATE_PERMISSIONS_LAYOUT':
                {
                    draftState.data = transformPermissionsData.transformPermissionsData(action.value);
                    break;
                }
            case 'UPDATE_ROUTES':
                {
                    draftState.routes = {
                        ...action.value
                    };
                    break;
                }
            case 'UPDATE_PERMISSIONS':
                {
                    draftState.selectedActions = [
                        ...action.value
                    ];
                    break;
                }
            case 'SET_SELECTED_ACTION':
                {
                    draftState.selectedAction = action.value;
                    break;
                }
            default:
                return draftState;
        }
    });

exports.initialState = initialState;
exports.reducer = reducer;
//# sourceMappingURL=reducer.js.map
