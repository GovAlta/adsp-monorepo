import { createContext, useState } from 'react';
interface FormInputContextProps {
  children?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

export const DirtyData = {
  isDirty: false,
  // eslint-disable-next-line
  setIsDirty: (dirty: boolean) => {},
  formInputPath: '',
  // eslint-disable-next-line
  setFormInputPath: (path: string) => {},
};

export const FormInputContext = createContext(DirtyData);

export const FormInputContextProvider = ({ children }: FormInputContextProps): JSX.Element | null => {
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [formInputPath, setFormInputPath] = useState<string>('');
  const objDirtyData = {
    isDirty,
    formInputPath,
    setFormInputPath,
    setIsDirty,
  };

  return <FormInputContext.Provider value={objDirtyData}>{children}</FormInputContext.Provider>;
};
