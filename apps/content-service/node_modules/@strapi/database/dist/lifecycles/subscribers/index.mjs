import 'lodash';

const isValidSubscriber = (subscriber)=>{
    return typeof subscriber === 'function' || typeof subscriber === 'object' && subscriber !== null;
};

export { isValidSubscriber };
//# sourceMappingURL=index.mjs.map
