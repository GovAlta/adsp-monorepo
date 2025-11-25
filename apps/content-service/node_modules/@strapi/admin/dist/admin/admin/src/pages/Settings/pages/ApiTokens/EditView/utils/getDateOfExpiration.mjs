import { format, addDays } from 'date-fns';
import * as locales from 'date-fns/locale';
import { getDateFnsLocaleName } from '../../../../../../utils/locales.mjs';

const getDateOfExpiration = (createdAt, duration, language = 'en')=>{
    if (duration && typeof duration === 'number') {
        const durationInDays = duration / 24 / 60 / 60 / 1000;
        return format(addDays(new Date(createdAt), durationInDays), 'PPP', {
            locale: locales[getDateFnsLocaleName(language)]
        });
    }
    return 'Unlimited';
};

export { getDateOfExpiration };
//# sourceMappingURL=getDateOfExpiration.mjs.map
