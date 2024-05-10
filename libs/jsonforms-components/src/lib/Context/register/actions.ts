import { Dispatch } from 'react';

export const ADD_REGISTER_DATA_ACTION = 'jsonforms/register/data/add';
export interface RegisterConfig {
  urn?: string;
  url?: string;
  name?: string;
  env?: string;
  token?: string;
  responsePrefixPath?: string;
  objectPathInArray?: string;
}

export interface LabelValueRegisterData {
  key: string;
  value: string;
}

export type RegisterDataType = string[] | LabelValueRegisterData[];
export interface RegisterConfigData extends RegisterConfig {
  data?: RegisterDataType;
}

export type RegisterData = RegisterConfigData[];
type AddDataAction = { type: string; payload: RegisterConfigData };

export type RegisterActions = AddDataAction;
export type JsonFormRegisterDispatch = Dispatch<RegisterActions>;
