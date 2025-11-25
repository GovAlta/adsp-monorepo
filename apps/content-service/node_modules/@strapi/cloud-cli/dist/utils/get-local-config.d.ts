import type { CLIContext } from '../types';
import { LocalSave } from '../services/strapi-info-save';
declare function getLocalConfig(ctx: CLIContext): Promise<LocalSave | null>;
declare function getLocalProject(ctx: CLIContext): Promise<Omit<import("../types").ProjectInfo, "id">>;
export { getLocalConfig, getLocalProject };
//# sourceMappingURL=get-local-config.d.ts.map