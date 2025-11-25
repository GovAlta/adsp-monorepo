'use strict';

var reactContext = require('@radix-ui/react-context');

const [PermissionsDataManagerProvider, usePermissionsDataManagerContext] = reactContext.createContext('PermissionsDataManager');
const usePermissionsDataManager = ()=>usePermissionsDataManagerContext('usePermissionsDataManager');

exports.PermissionsDataManagerProvider = PermissionsDataManagerProvider;
exports.usePermissionsDataManager = usePermissionsDataManager;
//# sourceMappingURL=usePermissionsDataManager.js.map
