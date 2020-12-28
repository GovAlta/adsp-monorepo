/*
 * This is a customized version of the NX @web preset, because in vue projects the caller is undefined
 */
module.exports = function (api, options) {
    api.assertVersion(7);
    return {
        presets: [
            // Support module/nomodule pattern.
            [
                require.resolve('@babel/preset-env'),
                {
                    // Allow importing core-js in entrypoint and use browserlist to select polyfills.
                    // This is needed for differential loading as well.
                    useBuiltIns: 'entry',
                    corejs: 3,
                    // Do not transform modules to CJS
                    modules: false,
                    targets: { esmodules: true },
                    bugfixes: true,
                    // Exclude transforms that make all code slower
                    exclude: ['transform-typeof-symbol'],
                },
            ],
            require.resolve('@babel/preset-typescript'),
        ],
        plugins: [
            require.resolve('babel-plugin-macros'),
            // Must use legacy decorators to remain compatible with TypeScript.
            [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
            [
                require.resolve('@babel/plugin-proposal-class-properties'),
                { loose: true },
            ],
        ],
        overrides: [
            // Convert `const enum` to `enum`. The former cannot be supported by babel
            // but at least we can get it to not error out.
            {
                test: /\.tsx?$/,
                plugins: [
                    [
                        require.resolve('babel-plugin-const-enum'),
                        {
                            transform: 'removeConst',
                        },
                    ],
                ],
            },
        ],
    };
};
//# sourceMappingURL=babel.js.map