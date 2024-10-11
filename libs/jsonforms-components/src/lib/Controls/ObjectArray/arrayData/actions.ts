import { Dispatch } from 'react';

export const ADD_DATA_ACTION = 'jsonforms/register/add_data_action';
export const INCREMENT_ACTION = 'jsonforms/register/increment_action';
export const DECREASE_ACTION = 'jsonforms/register/decrease_action';

export interface Categories {
  [category: string]: Category;
}

interface Category {
  count: number;
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

export type RegisterDataResponse = {
  categories: Categories;
};
type AddDataAction = { type: string; payload: AddData };
type IncrementAction = { type: string; payload: string };
type DecreaseAction = { type: string; payload: string };

export type ObjectArrayActions = AddDataAction | IncrementAction | DecreaseAction;

export type ArrayDataDispatch = Dispatch<ObjectArrayActions>;

export const initialState: ObjectArrayData = {
  categories: {},
};
