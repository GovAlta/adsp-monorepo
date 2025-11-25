'use strict';

var jsxRuntime = require('react/jsx-runtime');
var Context = require('./Context.js');

const GuidedTourProvider = ({ children })=>{
    const isGuidedTourEnabled = process.env.NODE_ENV !== 'test';
    return /*#__PURE__*/ jsxRuntime.jsx(Context.GuidedTourContext, {
        enabled: isGuidedTourEnabled,
        children: children
    });
};

exports.GuidedTourProvider = GuidedTourProvider;
//# sourceMappingURL=GuidedTourProvider.js.map
