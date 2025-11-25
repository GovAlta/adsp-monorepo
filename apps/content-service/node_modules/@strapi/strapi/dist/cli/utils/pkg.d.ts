import * as yup from 'yup';
import { Logger } from './logger';
interface Export {
    types?: string;
    source: string;
    module?: string;
    import?: string;
    require?: string;
    default: string;
}
declare const packageJsonSchema: import("yup/lib/object").OptionalObjectSchema<{
    name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    exports: import("yup/lib/Lazy").default<import("yup/lib/object").OptionalObjectSchema<Record<string, yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string> | yup.default<{
        types: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        source: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
        module: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        import: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        require: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        default: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
    }, import("yup/lib/object").AnyObject, import("yup/lib/object").TypeOfShape<{
        types: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        source: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
        module: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        import: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        require: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        default: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
    }>, import("yup/lib/object").AssertsShape<{
        types: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        source: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
        module: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        import: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        require: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        default: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
    }>>>, Record<string, any>, import("yup/lib/object").TypeOfShape<Record<string, yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string> | yup.default<{
        types: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        source: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
        module: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        import: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        require: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        default: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
    }, import("yup/lib/object").AnyObject, import("yup/lib/object").TypeOfShape<{
        types: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        source: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
        module: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        import: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        require: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        default: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
    }>, import("yup/lib/object").AssertsShape<{
        types: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        source: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
        module: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        import: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        require: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        default: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
    }>>>>>, any>;
}, Record<string, any>, import("yup/lib/object").TypeOfShape<{
    name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    exports: import("yup/lib/Lazy").default<import("yup/lib/object").OptionalObjectSchema<Record<string, yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string> | yup.default<{
        types: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        source: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
        module: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        import: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        require: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        default: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
    }, import("yup/lib/object").AnyObject, import("yup/lib/object").TypeOfShape<{
        types: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        source: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
        module: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        import: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        require: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        default: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
    }>, import("yup/lib/object").AssertsShape<{
        types: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        source: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
        module: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        import: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        require: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        default: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
    }>>>, Record<string, any>, import("yup/lib/object").TypeOfShape<Record<string, yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string> | yup.default<{
        types: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        source: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
        module: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        import: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        require: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        default: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
    }, import("yup/lib/object").AnyObject, import("yup/lib/object").TypeOfShape<{
        types: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        source: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
        module: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        import: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        require: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        default: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
    }>, import("yup/lib/object").AssertsShape<{
        types: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        source: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
        module: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        import: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        require: yup.default<import("yup/lib/types").Maybe<string | undefined>, import("yup/lib/object").AnyObject, string | undefined>;
        default: yup.default<import("yup/lib/types").Maybe<string>, import("yup/lib/object").AnyObject, string>;
    }>>>>>, any>;
}>>;
/**
 * @description being a task to load the package.json starting from the current working directory
 * using a shallow find for the package.json  and `fs` to read the file. If no package.json is found,
 * the process will throw with an appropriate error message.
 */
declare const loadPkg: ({ cwd, logger }: {
    cwd: string;
    logger: Logger;
}) => Promise<object>;
type PackageJson = yup.Asserts<typeof packageJsonSchema>;
/**
 * @description validate the package.json against a standardised schema using `yup`.
 * If the validation fails, the process will throw with an appropriate error message.
 */
declare const validatePkg: ({ pkg }: {
    pkg: object;
}) => Promise<PackageJson>;
export type { PackageJson, Export };
export { loadPkg, validatePkg };
//# sourceMappingURL=pkg.d.ts.map