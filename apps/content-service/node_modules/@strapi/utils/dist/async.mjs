import pMap from 'p-map';
import { curry } from 'lodash/fp';

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
const map = curry(pMap);
const reduce = (mixedArray)=>async (iteratee, initialValue)=>{
        let acc = initialValue;
        for(let i = 0; i < mixedArray.length; i += 1){
            acc = await iteratee(acc, await mixedArray[i], i);
        }
        return acc;
    };

export { map, pipe, reduce };
//# sourceMappingURL=async.mjs.map
