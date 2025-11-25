const createFlow = (flow)=>{
    const state = {
        step: null
    };
    /**
   * Equality check between two steps
   */ const stepEqual = (stepA, stepB)=>{
        if (stepA.kind === 'action' && stepB.kind === 'action') {
            return stepA.action === stepB.action;
        }
        if (stepA.kind === 'transfer' && stepB.kind === 'transfer') {
            return stepA.stage === stepB.stage;
        }
        return false;
    };
    /**
   * Find the index for a given step
   */ const findStepIndex = (step)=>flow.findIndex((flowStep)=>stepEqual(step, flowStep));
    return {
        has (step) {
            return findStepIndex(step) !== -1;
        },
        can (step) {
            if (state.step === null) {
                return true;
            }
            const indexesDifference = findStepIndex(step) - findStepIndex(state.step);
            // It's possible to send multiple time the same transfer step in a row
            if (indexesDifference === 0 && step.kind === 'transfer') {
                return true;
            }
            return indexesDifference > 0;
        },
        cannot (step) {
            return !this.can(step);
        },
        set (step) {
            const canSwitch = this.can(step);
            if (!canSwitch) {
                throw new Error('Impossible to proceed to the given step');
            }
            state.step = step;
            return this;
        },
        get () {
            return state.step;
        }
    };
};

export { createFlow };
//# sourceMappingURL=index.mjs.map
