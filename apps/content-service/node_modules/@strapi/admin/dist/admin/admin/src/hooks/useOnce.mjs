import * as React from 'react';

const useOnce = (effect)=>React.useEffect(effect, emptyDeps);
const emptyDeps = [];

export { useOnce };
//# sourceMappingURL=useOnce.mjs.map
