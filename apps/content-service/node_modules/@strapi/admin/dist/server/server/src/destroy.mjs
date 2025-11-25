import { getService } from './utils/index.mjs';

var destroy = (async ()=>{
    const { conditionProvider, actionProvider } = getService('permission');
    await conditionProvider.clear();
    await actionProvider.clear();
});

export { destroy as default };
//# sourceMappingURL=destroy.mjs.map
