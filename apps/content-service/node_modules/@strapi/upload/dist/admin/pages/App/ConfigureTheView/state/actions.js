'use strict';

var actionTypes = require('./actionTypes.js');

const onChange = ({ name, value })=>({
        type: actionTypes.ON_CHANGE,
        keys: name,
        value
    });
const setLoaded = ()=>({
        type: actionTypes.SET_LOADED
    });

exports.onChange = onChange;
exports.setLoaded = setLoaded;
//# sourceMappingURL=actions.js.map
