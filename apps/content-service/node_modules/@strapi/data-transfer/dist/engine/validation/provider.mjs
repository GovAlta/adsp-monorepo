import { capitalize } from 'lodash/fp';
import { TransferEngineValidationError } from '../errors.mjs';

const reject = (reason)=>{
    throw new TransferEngineValidationError(`Invalid provider supplied. ${reason}`);
};
const validateProvider = (type, provider)=>{
    if (!provider) {
        return reject(`Expected an instance of "${capitalize(type)}Provider", but got "${typeof provider}" instead.`);
    }
    if (provider.type !== type) {
        return reject(`Expected the provider to be of type "${type}" but got "${provider.type}" instead.`);
    }
};

export { validateProvider };
//# sourceMappingURL=provider.mjs.map
