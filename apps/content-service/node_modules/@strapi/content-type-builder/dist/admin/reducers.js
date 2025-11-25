'use strict';

var reducer$1 = require('./components/DataManager/reducer.js');
var reducer = require('./components/FormModal/reducer.js');

const reducers = {
    [`content-type-builder_formModal`]: reducer.reducer,
    [`content-type-builder_dataManagerProvider`]: reducer$1.reducer
};

exports.reducers = reducers;
//# sourceMappingURL=reducers.js.map
