import { createContext } from '@radix-ui/react-context';

const [PermissionsDataManagerProvider, usePermissionsDataManagerContext] = createContext('PermissionsDataManager');
const usePermissionsDataManager = ()=>usePermissionsDataManagerContext('usePermissionsDataManager');

export { PermissionsDataManagerProvider, usePermissionsDataManager };
//# sourceMappingURL=usePermissionsDataManager.mjs.map
