import { jsx } from 'react/jsx-runtime';
import { useForm, Layouts, BackButton } from '@strapi/admin/strapi-admin';
import { Button } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { COLLECTION_TYPES } from '../../../constants/collections.mjs';
import { capitalise } from '../../../utils/strings.mjs';
import { getTranslation } from '../../../utils/translations.mjs';

const Header = ({ name })=>{
    const { formatMessage } = useIntl();
    const params = useParams();
    const modified = useForm('Header', (state)=>state.modified);
    const isSubmitting = useForm('Header', (state)=>state.isSubmitting);
    return /*#__PURE__*/ jsx(Layouts.Header, {
        navigationAction: /*#__PURE__*/ jsx(BackButton, {
            fallback: `../${COLLECTION_TYPES}/${params.slug}`
        }),
        primaryAction: /*#__PURE__*/ jsx(Button, {
            size: "S",
            disabled: !modified,
            type: "submit",
            loading: isSubmitting,
            children: formatMessage({
                id: 'global.save',
                defaultMessage: 'Save'
            })
        }),
        subtitle: formatMessage({
            id: getTranslation('components.SettingsViewWrapper.pluginHeader.description.list-settings'),
            defaultMessage: 'Define the settings of the list view.'
        }),
        title: formatMessage({
            id: getTranslation('components.SettingsViewWrapper.pluginHeader.title'),
            defaultMessage: 'Configure the view - {name}'
        }, {
            name: capitalise(name)
        })
    });
};

export { Header };
//# sourceMappingURL=Header.mjs.map
