import { Dispatch } from 'react';

export const ADD_REGISTER_DATA_ACTION = 'jsonforms/register/data/add';
export const ADD_NO_ANONYMOUS_ACTION = 'jsonforms/register/no_anonymous';
export const ADD_DATALIST_ACTION = 'jsonforms/register/add_datalist_action';
export const ADD_REGISTER_DATA_ERROR = 'jsonforms/register/add_register_data_error';
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

export interface Errors {
  url: string;
  message: string;
}

export type RegisterDataType = string[] | LabelValueRegisterData[] | Record<string, unknown>[];
export interface RegisterConfigData extends RegisterConfig {
  data?: RegisterDataType;
  errors?: Record<string, Errors>;
  nonAnonymous?: string[];
  nonExistent?: string[];
}

export type RegisterData = RegisterConfigData[];
export type RegisterDataResponse = {
  registerData: RegisterConfigData[];
  nonExistent: string[];
  nonAnonymous: string[];
  errors: Record<string, Errors>;
};
type AddDataAction = { type: string; payload: RegisterConfigData };

export type RegisterActions = AddDataAction;
export type JsonFormRegisterDispatch = Dispatch<RegisterActions>;
