import { RegisterActions, ADD_REGISTER_DATA_ACTION, RegisterData } from './actions';
export function registerReducer(registerData: RegisterData, action: RegisterActions): RegisterData {
  switch (action.type) {
    case ADD_REGISTER_DATA_ACTION: {
      registerData.push(action.payload);
      return [...registerData];
    }
  }

  return registerData;
}
