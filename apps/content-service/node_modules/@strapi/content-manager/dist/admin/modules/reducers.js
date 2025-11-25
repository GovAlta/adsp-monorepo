'use strict';

var toolkit = require('@reduxjs/toolkit');
var app = require('./app.js');

const reducer = toolkit.combineReducers({
    app: app.reducer
});

exports.reducer = reducer;
//# sourceMappingURL=reducers.js.map
