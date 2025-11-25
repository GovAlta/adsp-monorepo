import { PropertyName } from 'lodash';
type Sanitizer = (value: unknown) => unknown;
declare const sanitizersRegistry: () => {
    get(path: PropertyName): Sanitizer[];
    add(path: PropertyName, sanitizer: Sanitizer): any;
    set(path: PropertyName, value?: never[]): any;
    has(path: PropertyName): boolean;
};
export default sanitizersRegistry;
//# sourceMappingURL=sanitizers.d.ts.map