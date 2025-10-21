import { createContext, ReactNode, useEffect, useReducer, useMemo, useContext } from 'react';
import { registerReducer } from './reducer';
import {
  RegisterConfig,
  RegisterConfigData,
  RegisterData,
  JsonFormRegisterDispatch,
  ADD_REGISTER_DATA_ACTION,
  ADD_NO_ANONYMOUS_ACTION,
  ADD_REGISTER_DATA_ERROR,
  ADD_DATALIST_ACTION,
  RegisterDataType,
} from './actions';
import { fetchRegister } from './util';

interface JsonFormsRegisterContextProps {
  registerDispatch: JsonFormRegisterDispatch;
  fetchRegisterByUrl: (registerConfig: RegisterConfig) => Promise<void>;
  selectRegisterData: (registerConfig: RegisterConfig) => RegisterDataType;
  fetchErrors: (registerConfig: RegisterConfig) => string;
  isProvided: boolean;
}

export const JsonFormsRegisterContext = createContext<JsonFormsRegisterContextProps | undefined>(undefined);

interface JsonFormsRegisterProviderProps {
  children: ReactNode;
  defaultRegisters: { registerData: RegisterData; dataList: string[]; nonAnonymous: string[] } | undefined;
}

export const JsonFormRegisterProvider = ({
  children,
  defaultRegisters,
}: JsonFormsRegisterProviderProps): JSX.Element => {
  const registerCtx = useContext(JsonFormsRegisterContext);
  const [registers, dispatch] = useReducer(registerReducer, {
    registerData: [],
    nonAnonymous: [],
    nonExistent: [],
    errors: {},
  });

  const context = useMemo(() => {
    return {
      isProvided: true,
      registerDispatch: dispatch,
      selectRegisterData: (criteria: RegisterConfig): RegisterDataType => {
        if (criteria?.url) {
          return registers.registerData?.find((r) => r.url === criteria.url)?.data || [];
        }

        if (criteria?.urn) {
          return registers.registerData?.find((r) => r.urn === criteria.urn)?.data || [];
        }

        return [];
      },
      fetchErrors: (criteria: RegisterConfig): string => {
        if (criteria?.url) {
          const matchFound = registers?.registerData.some((listItem) => {
            if (listItem?.url && criteria?.url?.toString().includes(listItem?.url)) {
              return true;
            }
            return false;
          });
          return matchFound ? '' : `${registers.errors[criteria?.url]?.message || ''}`;
        } else if (criteria?.urn) {
          if (registers?.nonExistent?.length > 0) {
            const matchFound = registers?.nonExistent.some((listItem) => {
              if (criteria?.urn?.toString().includes(listItem)) {
                return true;
              }
              return false;
            });
            if (!matchFound) {
              return 'The element does not exist';
            }
          }
        }
        return '';
      },
      fetchRegisterByUrl: async (registerConfig: RegisterConfig) => {
        // Prevent re-freshing remote data
        if (registers.registerData?.find((r) => r.url === registerConfig?.url)) {
          return;
        }
        const data = await fetchRegister(registerConfig);
        // TODO: check the data type
        if (Array.isArray(data)) {
          dispatch({ type: ADD_REGISTER_DATA_ACTION, payload: { ...registerConfig, data } });
        } else {
          const url = registerConfig.url || 'error';
          const errors = { [url]: { message: data || '', url: url } };

          if (JSON.stringify(registers.errors[url]) !== JSON.stringify(errors[url])) {
            dispatch({
              type: ADD_REGISTER_DATA_ERROR,
              payload: errors,
            });
          }
        }
      },
    };
  }, [registers]);

  useEffect(() => {
    if (defaultRegisters) {
      defaultRegisters?.registerData?.forEach((register) => {
        if ((register as unknown as RegisterConfigData)?.data !== undefined) {
          // Register comes with data from remote
          dispatch({ type: ADD_REGISTER_DATA_ACTION, payload: { ...register } });
        } else {
          (async () => {
            const data = await fetchRegister(register);
            if (Array.isArray(data)) {
              dispatch({ type: ADD_REGISTER_DATA_ACTION, payload: { ...register, data } });
            }
          })();
        }
      });
      if (defaultRegisters?.nonAnonymous?.length > 0) {
        dispatch({ type: ADD_NO_ANONYMOUS_ACTION, payload: { nonAnonymous: defaultRegisters?.nonAnonymous } });
      }
      if (defaultRegisters?.dataList?.length > 0) {
        dispatch({ type: ADD_DATALIST_ACTION, payload: { nonExistent: defaultRegisters?.dataList } });
      }
    }
  }, [dispatch, defaultRegisters]);
  /* The client might use the context outside of the Jsonform to provide custom register data */
  if (registerCtx?.isProvided) {
    // eslint-disable-next-line
    return <>{children}</>;
  }
  return <JsonFormsRegisterContext.Provider value={context}>{children}</JsonFormsRegisterContext.Provider>;
};
