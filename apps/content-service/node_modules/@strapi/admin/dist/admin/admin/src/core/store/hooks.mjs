import { createSelector } from '@reduxjs/toolkit';
import { useStore, useDispatch, useSelector } from 'react-redux';

const useTypedDispatch = useDispatch;
const useTypedStore = useStore;
const useTypedSelector = useSelector;
const createTypedSelector = (selector)=>createSelector((state)=>state, selector);

export { createTypedSelector, useTypedDispatch, useTypedSelector, useTypedStore };
//# sourceMappingURL=hooks.mjs.map
