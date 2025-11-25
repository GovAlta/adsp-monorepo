import homepageRouter from './homepage.mjs';
import release from './release.mjs';
import releaseAction from './release-action.mjs';
import settings from './settings.mjs';

const routes = {
    homepage: homepageRouter,
    settings,
    release,
    'release-action': releaseAction
};

export { routes };
//# sourceMappingURL=index.mjs.map
