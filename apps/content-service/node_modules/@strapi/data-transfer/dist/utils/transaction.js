'use strict';

var events = require('events');
var crypto = require('crypto');

const createTransaction = (strapi)=>{
    const fns = [];
    let done = false;
    let resume = null;
    const e = new events.EventEmitter();
    e.on('spawn', (uuid, cb)=>{
        fns.push({
            fn: cb,
            uuid
        });
        resume?.();
    });
    e.on('close', ()=>{
        e.removeAllListeners('rollback');
        e.removeAllListeners('spawn');
        done = true;
        resume?.();
    });
    strapi.db.transaction(async ({ trx, rollback })=>{
        e.once('rollback', async ()=>{
            e.removeAllListeners('close');
            e.removeAllListeners('spawn');
            try {
                await rollback();
                e.emit('rollback_completed');
            } catch  {
                e.emit('rollback_failed');
            } finally{
                done = true;
                resume?.();
            }
        });
        while(!done){
            while(fns.length){
                const item = fns.shift();
                if (item) {
                    const { fn, uuid } = item;
                    try {
                        const res = await fn(trx);
                        e.emit(uuid, {
                            data: res
                        });
                    } catch (error) {
                        e.emit(uuid, {
                            error
                        });
                    }
                }
            }
            if (!done && !fns.length) {
                // eslint-disable-next-line @typescript-eslint/no-loop-func
                await new Promise((resolve)=>{
                    resume = resolve;
                });
            }
        }
    });
    return {
        async attach (callback) {
            const uuid = crypto.randomUUID();
            e.emit('spawn', uuid, callback);
            return new Promise((resolve, reject)=>{
                e.on(uuid, ({ data, error })=>{
                    if (data) {
                        resolve(data);
                    }
                    if (error) {
                        reject(error);
                    }
                    resolve(undefined);
                });
            });
        },
        end () {
            return e.emit('close');
        },
        rollback () {
            return new Promise((resolve)=>{
                e.emit('rollback');
                e.once('rollback_failed', ()=>resolve(false));
                e.once('rollback_completed', ()=>resolve(true));
            });
        }
    };
};

exports.createTransaction = createTransaction;
//# sourceMappingURL=transaction.js.map
