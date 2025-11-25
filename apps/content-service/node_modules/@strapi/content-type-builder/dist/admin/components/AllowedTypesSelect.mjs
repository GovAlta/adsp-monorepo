import { jsxs, jsx } from 'react/jsx-runtime';
import { Field, MultiSelectNested } from '@strapi/design-system';
import upperFirst from 'lodash/upperFirst';
import { useIntl } from 'react-intl';

const options = [
    {
        label: 'All',
        children: [
            {
                label: 'images (JPEG, PNG, GIF, SVG, TIFF, ICO, DVU)',
                value: 'images'
            },
            {
                label: 'videos (MPEG, MP4, Quicktime, WMV, AVI, FLV)',
                value: 'videos'
            },
            {
                label: 'audios (MP3, WAV, OGG)',
                value: 'audios'
            },
            {
                label: 'files (CSV, ZIP, PDF, Excel, JSON, ...)',
                value: 'files'
            }
        ]
    }
];
const AllowedTypesSelect = ({ intlLabel, name, onChange, value = null })=>{
    const { formatMessage } = useIntl();
    /* eslint-disable indent */ const displayedValue = value === null || value?.length === 0 ? formatMessage({
        id: 'global.none',
        defaultMessage: 'None'
    }) : [
        ...value
    ].sort().map((v)=>upperFirst(v)).join(', ');
    /* eslint-enable indent */ const label = intlLabel.id ? formatMessage({
        id: intlLabel.id,
        defaultMessage: intlLabel.defaultMessage
    }) : name;
    return /*#__PURE__*/ jsxs(Field.Root, {
        name: name,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsx(MultiSelectNested, {
                customizeContent: ()=>displayedValue,
                onChange: (values)=>{
                    if (values.length > 0) {
                        onChange({
                            target: {
                                name,
                                value: values,
                                type: 'allowed-types-select'
                            }
                        });
                    } else {
                        onChange({
                            target: {
                                name,
                                value: null,
                                type: 'allowed-types-select'
                            }
                        });
                    }
                },
                options: options,
                value: value || []
            })
        ]
    });
};

export { AllowedTypesSelect };
//# sourceMappingURL=AllowedTypesSelect.mjs.map
