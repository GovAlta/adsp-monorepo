import reviewWorkflows from './review-workflows.mjs';
import homepage from '../homepage/index.mjs';

var routes = {
    'review-workflows': reviewWorkflows,
    ...homepage.routes
};

export { routes as default };
//# sourceMappingURL=index.mjs.map
