import react, { createContext, useReducer, ReactNode, useMemo } from 'react';
import {
  CustomError,
  CustomErrorIdentifier,
  customErrorReducer,
  CUSTOM_ERROR_ADD_ACTION,
  CUSTOM_ERROR_DELETE_ACTION,
  CUSTOM_ERROR_RESET_ACTION,
} from './reducer';

export const CustomErrorContext = createContext<any>(null);

interface CustomErrorProviderProps {
  children: ReactNode;
}
export const CustomErrorProvider = ({ children }: CustomErrorProviderProps): JSX.Element => {
  const [errors, dispatch] = useReducer(customErrorReducer, []);

  const context = useMemo(() => {
    return {
      customErrorDispatch: dispatch,
      selectCustomerErrorsByPath: (path: string) => {
        return errors.filter((e) => e.path === path).map((e) => e.error);
      },
      addCustomError: (error: CustomError) => {
        dispatch({ type: CUSTOM_ERROR_ADD_ACTION, error });
      },
      removeCustomError: (errorIdentifier: CustomErrorIdentifier) => {
        dispatch({ type: CUSTOM_ERROR_DELETE_ACTION, errorIdentifier });
      },
      resetCustomerError: (errorIdentifier: CustomErrorIdentifier) => {
        dispatch({ type: CUSTOM_ERROR_RESET_ACTION, errorIdentifier });
      },
    };
  }, [errors]);

  return <CustomErrorContext.Provider value={context}>{children}</CustomErrorContext.Provider>;
};

export default CustomErrorProvider;
