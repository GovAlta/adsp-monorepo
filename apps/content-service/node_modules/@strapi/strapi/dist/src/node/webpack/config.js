'use strict';

var ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
var browserslistToEsbuild = require('browserslist-to-esbuild');
var esbuildLoader = require('esbuild-loader');
var ForkTsCheckerPlugin = require('fork-ts-checker-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var crypto = require('node:crypto');
var path = require('node:path');
var readPkgUp = require('read-pkg-up');
var webpack = require('webpack');
var webpackBundleAnalyzer = require('webpack-bundle-analyzer');
var monorepo = require('../core/monorepo.js');
var config = require('../core/config.js');
var aliases = require('../core/aliases.js');

const resolveBaseConfig = async (ctx)=>{
    const target = browserslistToEsbuild(ctx.target);
    return {
        experiments: {
            topLevelAwait: true
        },
        entry: {
            main: [
                `./${ctx.entry}`
            ]
        },
        resolve: {
            alias: {
                react: getModulePath('react'),
                'react-dom': getModulePath('react-dom'),
                'styled-components': getModulePath('styled-components'),
                'react-router-dom': getModulePath('react-router-dom')
            },
            extensions: [
                '.js',
                '.jsx',
                '.react.js',
                '.ts',
                '.tsx'
            ]
        },
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    loader: require.resolve('esbuild-loader'),
                    options: {
                        loader: 'tsx',
                        target,
                        jsx: 'automatic'
                    }
                },
                {
                    test: /\.(js|jsx|mjs)$/,
                    use: {
                        loader: require.resolve('esbuild-loader'),
                        options: {
                            loader: 'jsx',
                            target,
                            jsx: 'automatic'
                        }
                    }
                },
                {
                    test: /\.m?js/,
                    resolve: {
                        fullySpecified: false
                    }
                },
                {
                    test: /\.css$/i,
                    use: [
                        require.resolve('style-loader'),
                        require.resolve('css-loader')
                    ]
                },
                {
                    test: /\.(svg|eot|otf|ttf|woff|woff2)$/,
                    type: 'asset/resource'
                },
                {
                    test: [
                        /\.bmp$/,
                        /\.gif$/,
                        /\.jpe?g$/,
                        /\.png$/,
                        /\.ico$/
                    ],
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
                            maxSize: 1000
                        }
                    }
                },
                {
                    test: /\.(mp4|webm)$/,
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
                            maxSize: 10000
                        }
                    }
                }
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({
                inject: true,
                template: path.resolve(ctx.runtimeDir, 'index.html')
            }),
            new webpack.DefinePlugin(Object.entries(ctx.env).reduce((acc, [key, value])=>{
                acc[`process.env.${key}`] = JSON.stringify(value);
                return acc;
            }, {})),
            ctx.tsconfig && new ForkTsCheckerPlugin({
                typescript: {
                    configFile: ctx.tsconfig.path,
                    configOverwrite: {
                        compilerOptions: {
                            sourceMap: ctx.options.sourcemaps
                        }
                    }
                }
            })
        ].filter(Boolean)
    };
};
const resolveDevelopmentConfig = async (ctx)=>{
    const baseConfig = await resolveBaseConfig(ctx);
    const monorepo$1 = await monorepo.loadStrapiMonorepo(ctx.cwd);
    return {
        ...baseConfig,
        cache: {
            type: 'filesystem',
            // version cache when there are changes to aliases
            buildDependencies: {
                config: [
                    __filename
                ]
            },
            version: crypto.createHash('md5').update(Object.entries(baseConfig.resolve.alias ?? {}).join()).digest('hex')
        },
        resolve: {
            ...baseConfig.resolve,
            alias: {
                ...baseConfig.resolve.alias,
                ...aliases.getMonorepoAliases({
                    monorepo: monorepo$1
                })
            }
        },
        entry: {
            ...baseConfig.entry,
            main: [
                `${require.resolve('webpack-hot-middleware/client')}?path=/__webpack_hmr`,
                ...baseConfig.entry.main
            ]
        },
        stats: 'errors-warnings',
        mode: 'development',
        devtool: 'inline-source-map',
        output: {
            filename: '[name].js',
            path: ctx.distPath,
            publicPath: ctx.basePath
        },
        infrastructureLogging: {
            level: 'error'
        },
        plugins: [
            ...baseConfig.plugins,
            new webpack.HotModuleReplacementPlugin(),
            new ReactRefreshWebpackPlugin()
        ]
    };
};
const resolveProductionConfig = async (ctx)=>{
    const target = browserslistToEsbuild(ctx.target);
    const baseConfig = await resolveBaseConfig(ctx);
    return {
        ...baseConfig,
        stats: 'errors-only',
        mode: 'production',
        bail: true,
        devtool: ctx.options.sourcemaps ? 'source-map' : false,
        output: {
            path: ctx.distPath,
            publicPath: ctx.basePath,
            // Utilize long-term caching by adding content hashes (not compilation hashes)
            // to compiled assets for production
            filename: '[name].[contenthash:8].js',
            chunkFilename: '[name].[contenthash:8].chunk.js'
        },
        optimization: {
            minimize: ctx.options.minify,
            minimizer: [
                new esbuildLoader.EsbuildPlugin({
                    target,
                    css: true
                })
            ],
            moduleIds: 'deterministic',
            runtimeChunk: true
        },
        plugins: [
            ...baseConfig.plugins,
            new MiniCssExtractPlugin({
                filename: '[name].[chunkhash].css',
                chunkFilename: '[name].[chunkhash].chunkhash.css',
                ignoreOrder: true
            }),
            ctx.options.stats && new webpackBundleAnalyzer.BundleAnalyzerPlugin()
        ].filter(Boolean)
    };
};
const USER_CONFIGS = [
    'webpack.config.js',
    'webpack.config.mjs',
    'webpack.config.ts'
];
const mergeConfigWithUserConfig = async (config$1, ctx)=>{
    const userConfig = await config.getUserConfig(USER_CONFIGS, ctx);
    if (userConfig) {
        if (typeof userConfig === 'function') {
            const webpack = await import('webpack');
            return userConfig(config$1, webpack);
        }
        ctx.logger.warn(`You've exported something other than a function from ${path.join(ctx.appDir, 'src', 'admin', 'webpack.config')}, this will ignored.`);
    }
    return config$1;
};
/**
 * @internal This function is used to resolve the path of a module.
 * It mimics what vite does internally already.
 */ const getModulePath = (mod)=>{
    const modulePath = require.resolve(mod);
    const pkg = readPkgUp.sync({
        cwd: path.dirname(modulePath)
    });
    return pkg ? path.dirname(pkg.path) : modulePath;
};

exports.mergeConfigWithUserConfig = mergeConfigWithUserConfig;
exports.resolveDevelopmentConfig = resolveDevelopmentConfig;
exports.resolveProductionConfig = resolveProductionConfig;
//# sourceMappingURL=config.js.map
