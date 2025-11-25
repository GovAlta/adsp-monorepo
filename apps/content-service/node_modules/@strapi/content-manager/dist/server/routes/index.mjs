import admin from './admin.mjs';
import history from '../history/index.mjs';
import preview from '../preview/index.mjs';
import homepage from '../homepage/index.mjs';

var routes = {
    admin,
    ...history.routes ? history.routes : {},
    ...preview.routes ? preview.routes : {},
    ...homepage.routes
};

export { routes as default };
//# sourceMappingURL=index.mjs.map
