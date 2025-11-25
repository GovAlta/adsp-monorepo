import { PropertyName } from 'lodash';
type Validator = unknown;
declare const validatorsRegistry: () => {
    get(path: PropertyName): Validator[];
    add(path: PropertyName, validator: Validator): any;
    set(path: PropertyName, value?: never[]): any;
    has(path: PropertyName): boolean;
};
export default validatorsRegistry;
//# sourceMappingURL=validators.d.ts.map