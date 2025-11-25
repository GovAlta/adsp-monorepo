import createDebug from 'debug';
import { DEBUG_NAMESPACE } from '../constants.mjs';

const createDebugger = (section = null, namespace = DEBUG_NAMESPACE)=>{
    return section !== null ? createDebug(`${namespace}:${section}`) : createDebug(namespace);
};

export { createDebugger };
//# sourceMappingURL=debug.mjs.map
