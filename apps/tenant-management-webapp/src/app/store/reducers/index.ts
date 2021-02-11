import { combineReducers } from "redux";

import File from "./file";
import serviceMeasure from "./serviceMeasure";
import User from "./user";
import Config from "./config";
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'

const rootReducer = combineReducers({ File, serviceMeasure, User, Config });
const persistConfig = {
  key: 'root',
  storage,
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

export default persistedReducer;