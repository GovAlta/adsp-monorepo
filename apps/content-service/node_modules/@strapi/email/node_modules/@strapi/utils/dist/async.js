'use strict';

var pMap = require('p-map');
var fp = require('lodash/fp');

function pipe(...fns) {
    const [firstFn, ...fnRest] = fns;
    return async (...args)=>{
        let res = await firstFn.apply(firstFn, args);
        for(let i = 0; i < fnRest.length; i += 1){
            res = await fnRest[i](res);
        }
        return res;
    };
}
const map = fp.curry(pMap);
const reduce = (mixedArray)=>async (iteratee, initialValue)=>{
        let acc = initialValue;
        for(let i = 0; i < mixedArray.length; i += 1){
            acc = await iteratee(acc, await mixedArray[i], i);
        }
        return acc;
    };

exports.map = map;
exports.pipe = pipe;
exports.reduce = reduce;
//# sourceMappingURL=async.js.map
