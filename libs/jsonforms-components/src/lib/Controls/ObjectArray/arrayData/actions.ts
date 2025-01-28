import { Dispatch } from 'react';

export const ADD_DATA_ACTION = 'jsonforms/register/add_data_action';
export const SET_DATA_ACTION = 'jsonforms/register/set_data_action';
export const INCREMENT_ACTION = 'jsonforms/register/increment_action';
export const DELETE_ACTION = 'jsonforms/register/delete_action';

export interface Categories {
  [category: string]: Category;
}

interface Category {
  count?: number;
  data: StateData;
}

interface Value {
  [key: string]: string;
}

interface NumObject {
  [name: string]: Value;
}

export interface StateData {
  [num: string]: NumObject;
}

export interface ObjectArrayData {
  categories: Categories;
}

export interface AddData {
  name: string;
  category: StateData;
}
export interface RemoveData {
  name: string;
  category: Category;
}

export interface DeleteData {
  path: string;
  value: number;
}

export type RegisterDataResponse = {
  categories: Categories;
};
type AddDataAction = { type: string; payload: AddData };
type SetDataAction = { type: string; payload: Categories };
type IncrementAction = { type: string; payload: string };
type DeleteAction = { type: string; payload: RemoveData };

export type ObjectArrayActions = AddDataAction | IncrementAction | DeleteAction | SetDataAction;

export type ArrayDataDispatch = Dispatch<ObjectArrayActions>;

export const initialState: ObjectArrayData = {
  categories: {},
};
