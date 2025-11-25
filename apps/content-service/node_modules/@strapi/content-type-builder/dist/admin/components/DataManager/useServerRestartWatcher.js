'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');

const TIMEOUT = 'timeout';
const timeout = 30 * 1000;
const useServerRestartWatcher = ()=>{
    const { get } = strapiAdmin.useFetchClient();
    const serverRestartWatcher = async (initTime)=>{
        const startTime = initTime ?? Date.now();
        if (Date.now() - startTime > timeout) {
            throw new Error(TIMEOUT);
        }
        try {
            const res = await get(`/content-type-builder/update-schema-status`);
            if (res?.data?.data?.isUpdating === true) {
                return new Promise((resolve)=>{
                    setTimeout(()=>{
                        return serverRestartWatcher(startTime).then(resolve);
                    }, 200);
                });
            }
        } catch (err) {
            return new Promise((resolve)=>{
                setTimeout(()=>{
                    return serverRestartWatcher(startTime).then(resolve);
                }, 200);
            });
        }
    };
    return serverRestartWatcher;
};

exports.useServerRestartWatcher = useServerRestartWatcher;
//# sourceMappingURL=useServerRestartWatcher.js.map
