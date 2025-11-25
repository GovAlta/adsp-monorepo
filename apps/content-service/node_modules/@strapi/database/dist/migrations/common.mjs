const wrapTransaction = (db)=>(fn)=>()=>{
            return db.transaction(({ trx })=>Promise.resolve(fn(trx, db)));
        };

export { wrapTransaction };
//# sourceMappingURL=common.mjs.map
