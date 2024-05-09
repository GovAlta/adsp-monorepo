import { createContext, ReactNode, useEffect, useReducer, useMemo, useContext } from 'react';
import { registerReducer } from './reducer';
import {
  RegisterConfig,
  RegisterConfigData,
  RegisterData,
  JsonFormRegisterDispatch,
  ADD_REGISTER_DATA_ACTION,
  RegisterDataType,
} from './actions';
import { fetchRegister } from './util';

interface JsonFormsRegisterContextProps {
  registerDispatch: JsonFormRegisterDispatch;
  fetchRegisterByUrl: (registerConfig: RegisterConfig) => Promise<void>;
  selectRegisterData: (registerConfig: RegisterConfig) => RegisterDataType;
  isProvided: boolean;
}

export const JsonFormsRegisterContext = createContext<JsonFormsRegisterContextProps | undefined>(undefined);

interface JsonFormsRegisterProviderProps {
  children: ReactNode;
  defaultRegisters: RegisterConfig[] | RegisterData | undefined;
}

export const JsonFormRegisterProvider = ({
  children,
  defaultRegisters,
}: JsonFormsRegisterProviderProps): JSX.Element => {
  const registerCtx = useContext(JsonFormsRegisterContext);
  const [registers, dispatch] = useReducer(registerReducer, []);

  const context = useMemo(() => {
    return {
      isProvided: true,
      registerDispatch: dispatch,
      selectRegisterData: (criteria: RegisterConfig): RegisterDataType => {
        if (criteria?.url) {
          return registers?.find((r) => r.url === criteria.url)?.data || [];
        }

        if (criteria?.urn) {
          return registers?.find((r) => r.urn === criteria.urn)?.data || [];
        }

        return [];
      },
      fetchRegisterByUrl: async (registerConfig: RegisterConfig) => {
        // Prevent re-freshing remote data
        if (registers?.find((r) => r.url === registerConfig?.url)) {
          return;
        }
        const data = await fetchRegister(registerConfig);
        // TODO: check the data type
        if (data) {
          dispatch({ type: ADD_REGISTER_DATA_ACTION, payload: { ...registerConfig, data } });
        }
      },
    };
  }, [registers]);

  useEffect(() => {
    if (defaultRegisters) {
      defaultRegisters?.forEach((register) => {
        if ((register as unknown as RegisterConfigData)?.data !== undefined) {
          // Register comes with data from remote
          dispatch({ type: ADD_REGISTER_DATA_ACTION, payload: { ...register } });
        } else {
          (async () => {
            const data = await fetchRegister(register);
            if (data) {
              dispatch({ type: ADD_REGISTER_DATA_ACTION, payload: { ...register, data } });
            }
          })();
        }
      });
    }
  }, [dispatch, defaultRegisters]);
  /* The client might use the context outside of the Jsonform to provide custom register data */
  if (registerCtx?.isProvided) {
    // eslint-disable-next-line
    return <>{children}</>;
  }
  return <JsonFormsRegisterContext.Provider value={context}>{children}</JsonFormsRegisterContext.Provider>;
};
