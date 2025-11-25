import collectionTypes from './collection-types.mjs';
import components from './components.mjs';
import contentTypes from './content-types.mjs';
import init from './init.mjs';
import relations from './relations.mjs';
import singleTypes from './single-types.mjs';
import uid from './uid.mjs';
import history from '../history/index.mjs';
import preview from '../preview/index.mjs';
import homepage from '../homepage/index.mjs';

var controllers = {
    'collection-types': collectionTypes,
    components,
    'content-types': contentTypes,
    init,
    relations,
    'single-types': singleTypes,
    uid,
    ...history.controllers ? history.controllers : {},
    ...preview.controllers ? preview.controllers : {},
    ...homepage.controllers
};

export { controllers as default };
//# sourceMappingURL=index.mjs.map
