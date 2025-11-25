import loadSrcIndex from './src-index.mjs';
import loadAPIs from './apis.mjs';
import loadMiddlewares from './middlewares.mjs';
import loadComponents from './components.mjs';
import loadPolicies from './policies.mjs';
import loadPlugins from './plugins/index.mjs';
import loadSanitizers from './sanitizers.mjs';
import loadValidators from './validators.mjs';

async function loadApplicationContext(strapi) {
    await Promise.all([
        loadSrcIndex(strapi),
        loadSanitizers(strapi),
        loadValidators(strapi),
        loadPlugins(strapi),
        loadAPIs(strapi),
        loadComponents(strapi),
        loadMiddlewares(strapi),
        loadPolicies(strapi)
    ]);
}

export { loadApplicationContext };
//# sourceMappingURL=index.mjs.map
