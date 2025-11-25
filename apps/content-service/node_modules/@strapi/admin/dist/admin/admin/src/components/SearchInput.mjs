import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { SearchForm, Searchbar, IconButton } from '@strapi/design-system';
import { Search } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useTracking } from '../features/Tracking.mjs';
import { useQueryParams } from '../hooks/useQueryParams.mjs';

const SearchInput = ({ disabled, label, placeholder, trackedEvent, trackedEventDetails })=>{
    const inputRef = React.useRef(null);
    const iconButtonRef = React.useRef(null);
    const [{ query }, setQuery] = useQueryParams();
    const [value, setValue] = React.useState(query?._q || '');
    const [isOpen, setIsOpen] = React.useState(!!value);
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const handleToggle = ()=>setIsOpen((prev)=>!prev);
    React.useLayoutEffect(()=>{
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [
        isOpen
    ]);
    const handleClear = ()=>{
        setValue('');
        setQuery({
            _q: ''
        }, 'remove');
    };
    const handleSubmit = (e)=>{
        e.preventDefault();
        // Ensure value is a string
        if (value) {
            if (trackedEvent) {
                trackUsage(trackedEvent, trackedEventDetails);
            }
            setQuery({
                _q: encodeURIComponent(value),
                page: 1
            });
        } else {
            handleToggle();
            setQuery({
                _q: ''
            }, 'remove');
        }
    };
    if (isOpen) {
        return /*#__PURE__*/ jsx(SearchForm, {
            onSubmit: handleSubmit,
            children: /*#__PURE__*/ jsx(Searchbar, {
                ref: inputRef,
                name: "search",
                onChange: (e)=>setValue(e.target.value),
                value: value,
                clearLabel: formatMessage({
                    id: 'clearLabel',
                    defaultMessage: 'Clear'
                }),
                onClear: handleClear,
                placeholder: placeholder,
                onBlur: (e)=>{
                    if (!e.currentTarget.contains(e.relatedTarget) && e.currentTarget.value === '') {
                        setIsOpen(false);
                    }
                },
                children: label
            })
        });
    }
    return /*#__PURE__*/ jsx(IconButton, {
        ref: iconButtonRef,
        disabled: disabled,
        label: formatMessage({
            id: 'global.search',
            defaultMessage: 'Search'
        }),
        onClick: handleToggle,
        children: /*#__PURE__*/ jsx(Search, {})
    });
};

export { SearchInput };
//# sourceMappingURL=SearchInput.mjs.map
