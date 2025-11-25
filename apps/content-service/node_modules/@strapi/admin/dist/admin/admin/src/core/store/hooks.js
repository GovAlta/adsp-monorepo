'use strict';

var toolkit = require('@reduxjs/toolkit');
var reactRedux = require('react-redux');

const useTypedDispatch = reactRedux.useDispatch;
const useTypedStore = reactRedux.useStore;
const useTypedSelector = reactRedux.useSelector;
const createTypedSelector = (selector)=>toolkit.createSelector((state)=>state, selector);

exports.createTypedSelector = createTypedSelector;
exports.useTypedDispatch = useTypedDispatch;
exports.useTypedSelector = useTypedSelector;
exports.useTypedStore = useTypedStore;
//# sourceMappingURL=hooks.js.map
