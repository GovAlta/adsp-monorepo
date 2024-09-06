import {
  RegisterActions,
  ADD_REGISTER_DATA_ACTION,
  ADD_NO_ANONYMOUS_ACTION,
  ADD_DATALIST_ACTION,
  ADD_REGISTER_DATA_ERROR,
  RegisterData,
  RegisterDataResponse,
  Errors,
} from './actions';
export function registerReducer(
  state: { registerData: RegisterData; nonExistent: string[]; nonAnonymous: string[]; errors: Record<string, Errors> },
  action: RegisterActions
): RegisterDataResponse {
  switch (action.type) {
    case ADD_REGISTER_DATA_ERROR: {
      const errors = action.payload as Record<string, Errors>;
      return { ...state, errors: { ...state.errors, ...errors } };
    }
    case ADD_REGISTER_DATA_ACTION: {
      const { registerData } = state;
      registerData.push(action.payload);

      return { ...state, registerData: registerData };
    }
    case ADD_NO_ANONYMOUS_ACTION: {
      return { ...state, nonAnonymous: action.payload.nonAnonymous || [] };
    }
    case ADD_DATALIST_ACTION: {
      return { ...state, nonExistent: action.payload.nonExistent || [] };
    }
  }

  return state;
}
