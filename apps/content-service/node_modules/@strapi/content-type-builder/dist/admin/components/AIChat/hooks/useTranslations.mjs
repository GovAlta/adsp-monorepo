import { useIntl } from 'react-intl';

const useTranslations = ()=>{
    const { formatMessage } = useIntl();
    const t = (id, defaultMessage)=>{
        return formatMessage({
            id,
            defaultMessage
        });
    };
    return {
        t
    };
};

export { useTranslations };
//# sourceMappingURL=useTranslations.mjs.map
