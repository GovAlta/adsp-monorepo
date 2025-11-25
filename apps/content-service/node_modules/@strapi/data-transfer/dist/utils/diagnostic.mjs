import { EventEmitter } from 'events';

const createDiagnosticReporter = (options = {})=>{
    const { stackSize = -1 } = options;
    const emitter = new EventEmitter();
    const stack = [];
    const addListener = (event, listener)=>{
        emitter.on(event, listener);
    };
    const isDiagnosticValid = (diagnostic)=>{
        if (!diagnostic.kind || !diagnostic.details || !diagnostic.details.message) {
            return false;
        }
        return true;
    };
    return {
        stack: {
            get size () {
                return stack.length;
            },
            get items () {
                return stack;
            }
        },
        report (diagnostic) {
            if (!isDiagnosticValid(diagnostic)) {
                return this;
            }
            emitter.emit('diagnostic', diagnostic);
            emitter.emit(`diagnostic.${diagnostic.kind}`, diagnostic);
            if (stackSize !== -1 && stack.length >= stackSize) {
                stack.shift();
            }
            stack.push(diagnostic);
            return this;
        },
        onDiagnostic (listener) {
            addListener('diagnostic', listener);
            return this;
        },
        on (kind, listener) {
            addListener(`diagnostic.${kind}`, listener);
            return this;
        }
    };
};

export { createDiagnosticReporter };
//# sourceMappingURL=diagnostic.mjs.map
