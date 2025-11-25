import crypto from 'crypto';
import { machineIdSync } from 'node-machine-id';

const generateInstallId = (projectId, installId)=>{
    if (installId) return installId;
    try {
        const machineId = machineIdSync();
        return projectId ? crypto.createHash('sha256').update(`${machineId}-${projectId}`).digest('hex') : crypto.randomUUID();
    } catch (error) {
        return crypto.randomUUID();
    }
};

export { generateInstallId };
//# sourceMappingURL=install-id.mjs.map
