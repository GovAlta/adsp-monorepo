import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking } from '@strapi/admin/strapi-admin';
import { SearchForm, Searchbar, IconButton } from '@strapi/design-system';
import { Search } from '@strapi/icons';
import { useIntl } from 'react-intl';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../../utils/getTrad.mjs';
import 'qs';
import '../../../../constants.mjs';
import '../../../../utils/urlYupSchema.mjs';

// TODO: find a better naming convention for the file that was an index file before
const SearchAsset = ({ onChangeSearch, queryValue = null })=>{
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const [isOpen, setIsOpen] = React.useState(!!queryValue);
    const [value, setValue] = React.useState(queryValue || '');
    const wrapperRef = React.useRef(null);
    React.useLayoutEffect(()=>{
        if (isOpen) {
            setTimeout(()=>{
                wrapperRef.current?.querySelector('input')?.focus();
            }, 0);
        }
    }, [
        isOpen
    ]);
    const handleToggle = ()=>{
        setIsOpen((prev)=>!prev);
    };
    const handleClear = ()=>{
        handleToggle();
        onChangeSearch(null);
    };
    const handleSubmit = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        trackUsage('didSearchMediaLibraryElements', {
            location: 'content-manager'
        });
        onChangeSearch(value);
    };
    if (isOpen) {
        return /*#__PURE__*/ jsx("div", {
            ref: wrapperRef,
            children: /*#__PURE__*/ jsx(SearchForm, {
                onSubmit: handleSubmit,
                children: /*#__PURE__*/ jsx(Searchbar, {
                    name: "search",
                    onClear: handleClear,
                    onChange: (e)=>setValue(e.target.value),
                    clearLabel: formatMessage({
                        id: getTrad('search.clear.label'),
                        defaultMessage: 'Clear the search'
                    }),
                    "aria-label": "search",
                    size: "S",
                    value: value,
                    placeholder: formatMessage({
                        id: getTrad('search.placeholder'),
                        defaultMessage: 'e.g: the first dog on the moon'
                    }),
                    children: formatMessage({
                        id: getTrad('search.label'),
                        defaultMessage: 'Search for an asset'
                    })
                })
            })
        });
    }
    return /*#__PURE__*/ jsx(IconButton, {
        label: "Search",
        onClick: handleToggle,
        children: /*#__PURE__*/ jsx(Search, {})
    });
};

export { SearchAsset };
//# sourceMappingURL=SearchAsset.mjs.map
