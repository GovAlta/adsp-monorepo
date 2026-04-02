const path = require('path');
const webpack = require('webpack');

const config = require(path.resolve(__dirname, '../webpack.template-react-vendors.config.js'));

webpack(config, (error, stats) => {
  if (error) {
    console.error('[builder-app] Failed to build react template vendor bundle.', error);
    process.exit(1);
  }

  const info = stats.toJson({ all: false, warnings: true, errors: true });

  if (stats.hasErrors()) {
    console.error('[builder-app] React template vendor bundle has errors.');
    for (const buildError of info.errors || []) {
      console.error(buildError.message || buildError);
    }
    process.exit(1);
  }

  if (stats.hasWarnings()) {
    console.warn('[builder-app] React template vendor bundle has warnings.');
    for (const warning of info.warnings || []) {
      console.warn(warning.message || warning);
    }
  }

  const summary = stats.toString({ colors: true, chunks: false, modules: false, entrypoints: false });
  console.log(summary);
});
