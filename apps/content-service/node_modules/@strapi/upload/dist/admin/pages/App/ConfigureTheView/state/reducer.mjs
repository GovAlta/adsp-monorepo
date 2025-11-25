import { produce } from 'immer';
import get from 'lodash/get';
import set from 'lodash/set';
import { SET_LOADED, ON_CHANGE } from './actionTypes.mjs';
import { init, initialState } from './init.mjs';

const reducer = (state = initialState, action = {
    type: ''
})=>// eslint-disable-next-line consistent-return
    produce(state, (draftState)=>{
        switch(action.type){
            case ON_CHANGE:
                {
                    if ('keys' in action && 'value' in action && action.keys) {
                        set(draftState, [
                            'modifiedData',
                            ...action.keys.split('.')
                        ], action.value);
                    }
                    break;
                }
            case SET_LOADED:
                {
                    // This action re-initialises the state using the current modifiedData.
                    const reInitialise = init(get(draftState, [
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

export { reducer };
//# sourceMappingURL=reducer.mjs.map
