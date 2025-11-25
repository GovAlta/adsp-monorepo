'use strict';

var path = require('path');
var fp = require('lodash/fp');

const getDirs = ({ appDir, distDir }, config)=>({
        dist: {
            root: distDir,
            src: path.join(distDir, 'src'),
            api: path.join(distDir, 'src', 'api'),
            components: path.join(distDir, 'src', 'components'),
            extensions: path.join(distDir, 'src', 'extensions'),
            policies: path.join(distDir, 'src', 'policies'),
            middlewares: path.join(distDir, 'src', 'middlewares'),
            config: path.join(distDir, 'config')
        },
        app: {
            root: appDir,
            src: path.join(appDir, 'src'),
            api: path.join(appDir, 'src', 'api'),
            components: path.join(appDir, 'src', 'components'),
            extensions: path.join(appDir, 'src', 'extensions'),
            policies: path.join(appDir, 'src', 'policies'),
            middlewares: path.join(appDir, 'src', 'middlewares'),
            config: path.join(appDir, 'config')
        },
        static: {
            public: path.resolve(appDir, fp.get('server.dirs.public', config))
        }
    });

exports.getDirs = getDirs;
//# sourceMappingURL=get-dirs.js.map
