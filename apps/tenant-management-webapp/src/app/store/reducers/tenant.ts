import { TYPES } from '../actions';


export const INITIAL_STATE = {
 tenant:null
}

export default (state = INITIAL_STATE, action) => {

  switch (action.type) {
    case TYPES.FETCH_TENANT_INFO_SUCCESS:
     return { ...state, tenant:{...action.payload} };

    case TYPES.FETCH_TENANT_INFO_FAILED:
      return { ...state, tenant: 'null', status: 'failed' };
    default:
      return state;
  }
};

