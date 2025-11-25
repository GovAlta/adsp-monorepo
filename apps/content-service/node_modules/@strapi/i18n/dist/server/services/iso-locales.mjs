import '../constants/index.mjs';
import isoLocales from '../constants/iso-locales.json.mjs';

const getIsoLocales = ()=>isoLocales;
const isoLocalesService = ()=>({
        getIsoLocales
    });

export { isoLocalesService as default };
//# sourceMappingURL=iso-locales.mjs.map
