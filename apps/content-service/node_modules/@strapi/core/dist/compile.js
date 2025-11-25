'use strict';

var tsUtils = require('@strapi/typescript-utils');

async function compile(options) {
    const { appDir = process.cwd(), ignoreDiagnostics = false } = options ?? {};
    const isTSProject = await tsUtils.isUsingTypeScript(appDir);
    const outDir = await tsUtils.resolveOutDir(appDir);
    if (isTSProject) {
        await tsUtils.compile(appDir, {
            configOptions: {
                options: {
                    incremental: true
                },
                ignoreDiagnostics
            }
        });
    }
    const distDir = isTSProject ? outDir : appDir;
    return {
        appDir,
        distDir
    };
}

module.exports = compile;
//# sourceMappingURL=compile.js.map
