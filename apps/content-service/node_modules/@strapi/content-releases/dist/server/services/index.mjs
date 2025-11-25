import createHomepageService from './homepage.mjs';
import createReleaseService from './release.mjs';
import createReleaseActionService from './release-action.mjs';
import createReleaseValidationService from './validation.mjs';
import createSchedulingService from './scheduling.mjs';
import createSettingsService from './settings.mjs';

const services = {
    homepage: createHomepageService,
    release: createReleaseService,
    'release-action': createReleaseActionService,
    'release-validation': createReleaseValidationService,
    scheduling: createSchedulingService,
    settings: createSettingsService
};

export { services };
//# sourceMappingURL=index.mjs.map
