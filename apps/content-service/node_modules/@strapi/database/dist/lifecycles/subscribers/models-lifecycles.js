'use strict';

/**
 * For each model try to run it's lifecycles function if any is defined
 */ const modelsLifecyclesSubscriber = async (event)=>{
    const { model } = event;
    if (model.lifecycles && event.action in model.lifecycles) {
        await model.lifecycles[event.action]?.(event);
    }
};

exports.modelsLifecyclesSubscriber = modelsLifecyclesSubscriber;
//# sourceMappingURL=models-lifecycles.js.map
