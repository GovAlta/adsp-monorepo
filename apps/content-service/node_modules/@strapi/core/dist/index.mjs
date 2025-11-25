import Strapi from './Strapi.mjs';
import 'open';
import 'lodash/fp';
import 'path';
import 'undici';
import './ee/license.mjs';
import { createUpdateNotifier } from './utils/update-notifier/index.mjs';
import 'chalk';
import 'cli-table3';
import '@paralleldrive/cuid2';
import 'node:assert';
import { destroyOnSignal } from './utils/signals.mjs';
import { resolveWorkingDirectories } from './utils/resolve-working-dirs.mjs';
export { default as compileStrapi } from './compile.mjs';
import * as factories from './factories.mjs';
export { factories };

const createStrapi = (options = {})=>{
    const strapi = new Strapi({
        ...options,
        ...resolveWorkingDirectories(options)
    });
    destroyOnSignal(strapi);
    createUpdateNotifier(strapi);
    // TODO: deprecate and remove in next major
    global.strapi = strapi;
    return strapi;
};

export { createStrapi };
//# sourceMappingURL=index.mjs.map
