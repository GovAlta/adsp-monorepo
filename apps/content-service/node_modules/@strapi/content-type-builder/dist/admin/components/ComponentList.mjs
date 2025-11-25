import { jsx } from 'react/jsx-runtime';
import get from 'lodash/get';
import { ComponentRow } from './ComponentRow.mjs';
import { useDataManager } from './DataManager/useDataManager.mjs';
import { List } from './List.mjs';

const ComponentList = ({ component, isFromDynamicZone = false, firstLoopComponentUid })=>{
    const { components } = useDataManager();
    const type = get(components, component);
    if (!type) return;
    return /*#__PURE__*/ jsx(ComponentRow, {
        $isChildOfDynamicZone: isFromDynamicZone,
        className: "component-row",
        children: /*#__PURE__*/ jsx(List, {
            type: type,
            firstLoopComponentUid: firstLoopComponentUid || component,
            isFromDynamicZone: isFromDynamicZone,
            isSub: true,
            secondLoopComponentUid: firstLoopComponentUid ? component : null
        })
    });
};

export { ComponentList };
//# sourceMappingURL=ComponentList.mjs.map
