'use strict';

var crypto = require('crypto');
var nodeMachineId = require('node-machine-id');

const generateInstallId = (projectId, installId)=>{
    if (installId) return installId;
    try {
        const machineId = nodeMachineId.machineIdSync();
        return projectId ? crypto.createHash('sha256').update(`${machineId}-${projectId}`).digest('hex') : crypto.randomUUID();
    } catch (error) {
        return crypto.randomUUID();
    }
};

exports.generateInstallId = generateInstallId;
//# sourceMappingURL=install-id.js.map
