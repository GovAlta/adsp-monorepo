'use strict';

const wrapTransaction = (db)=>(fn)=>()=>{
            return db.transaction(({ trx })=>Promise.resolve(fn(trx, db)));
        };

exports.wrapTransaction = wrapTransaction;
//# sourceMappingURL=common.js.map
