import components from './components.mjs';
import service from './content-types.mjs';
import dataMapper from './data-mapper.mjs';
import createFieldSizesService from './field-sizes.mjs';
import metrics from './metrics.mjs';
import permissionChecker from './permission-checker.mjs';
import permission from './permission.mjs';
import populateBuilder from './populate-builder.mjs';
import uid from './uid.mjs';
import history from '../history/index.mjs';
import preview from '../preview/index.mjs';
import homepage from '../homepage/index.mjs';
import documentMetadata from './document-metadata.mjs';
import documentManager from './document-manager.mjs';

var services = {
    components,
    'content-types': service,
    'data-mapper': dataMapper,
    'document-metadata': documentMetadata,
    'document-manager': documentManager,
    'field-sizes': createFieldSizesService,
    metrics,
    'permission-checker': permissionChecker,
    permission,
    'populate-builder': populateBuilder,
    uid,
    ...history.services ? history.services : {},
    ...preview.services ? preview.services : {},
    ...homepage.services
};

export { services as default };
//# sourceMappingURL=index.mjs.map
