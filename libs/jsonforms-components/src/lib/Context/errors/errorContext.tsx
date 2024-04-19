import react, { createContext, useReducer, ReactNode, useMemo } from 'react';
import { CustomerErrorDispatch, Errors, customErrorReducer, CUSTOM_ERROR_ADD_ACTION } from './reducer';
import { ErrorObject } from 'ajv';

export const CustomErrorContext = createContext<any>(null);

interface CustomErrorProviderProps {
  children: ReactNode;
}
export const CustomErrorProvider = ({ children }: CustomErrorProviderProps): JSX.Element => {
  const [errors, dispatch] = useReducer(customErrorReducer, []);

  const context = useMemo(() => {
    return {
      errors: errors,
      customErrorDispatch: dispatch,
      addCustomError: (error: ErrorObject) => {
        dispatch({ type: CUSTOM_ERROR_ADD_ACTION, error });
      },
    };
  }, []);

  return <CustomErrorContext.Provider value={context}>{children}</CustomErrorContext.Provider>;
};

export default CustomErrorProvider;
