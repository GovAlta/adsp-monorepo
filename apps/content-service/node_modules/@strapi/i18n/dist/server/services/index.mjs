import permissions from './permissions.mjs';
import metrics from './metrics.mjs';
import localizations from './localizations.mjs';
import locales from './locales.mjs';
import isoLocalesService from './iso-locales.mjs';
import contentTypes from './content-types.mjs';
import sanitize from './sanitize/index.mjs';

var services = {
    permissions,
    metrics,
    localizations,
    locales,
    sanitize,
    'iso-locales': isoLocalesService,
    'content-types': contentTypes
};

export { services as default };
//# sourceMappingURL=index.mjs.map
