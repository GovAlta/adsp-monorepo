'use strict';

var jsxRuntime = require('react/jsx-runtime');
var get = require('lodash/get');
var ComponentRow = require('./ComponentRow.js');
var useDataManager = require('./DataManager/useDataManager.js');
var List = require('./List.js');

const ComponentList = ({ component, isFromDynamicZone = false, firstLoopComponentUid })=>{
    const { components } = useDataManager.useDataManager();
    const type = get(components, component);
    if (!type) return;
    return /*#__PURE__*/ jsxRuntime.jsx(ComponentRow.ComponentRow, {
        $isChildOfDynamicZone: isFromDynamicZone,
        className: "component-row",
        children: /*#__PURE__*/ jsxRuntime.jsx(List.List, {
            type: type,
            firstLoopComponentUid: firstLoopComponentUid || component,
            isFromDynamicZone: isFromDynamicZone,
            isSub: true,
            secondLoopComponentUid: firstLoopComponentUid ? component : null
        })
    });
};

exports.ComponentList = ComponentList;
//# sourceMappingURL=ComponentList.js.map
