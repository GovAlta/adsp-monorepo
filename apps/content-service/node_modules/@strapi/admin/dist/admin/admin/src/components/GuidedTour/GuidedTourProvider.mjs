import { jsx } from 'react/jsx-runtime';
import { GuidedTourContext } from './Context.mjs';

const GuidedTourProvider = ({ children })=>{
    const isGuidedTourEnabled = process.env.NODE_ENV !== 'test';
    return /*#__PURE__*/ jsx(GuidedTourContext, {
        enabled: isGuidedTourEnabled,
        children: children
    });
};

export { GuidedTourProvider };
//# sourceMappingURL=GuidedTourProvider.mjs.map
