'use strict';

var React = require('react');
var reactRouterDom = require('react-router-dom');

/**
 * @description Given the name of an input field (this does not need to be the name you pass as a prop to the DOM element),
 * when the query param `field` matches the name the field will be focused & scrolled into the center of the view.
 * Uses a callback ref to set the field to ensure asynchronous rendering of inputs does not cause issues e.g. CodeMirror.EditView
 *
 * @example
 * ```tsx
 * const fieldRef = useFocusInputField('name');
 *
 * return (
 *  <input ref={fieldRef} />
 * );
 * ```
 */ const useFocusInputField = (name)=>{
    const { search: searchString } = reactRouterDom.useLocation();
    const search = React.useMemo(()=>new URLSearchParams(searchString), [
        searchString
    ]);
    /**
   * TODO: remove union and just use `HTMLElement`
   *
   * Realistically, it will only be an `HTMLElement` but `TextInput` in the design-system
   * has an imperativeHandle we can't remove until v2 of the design-system.
   */ const [field, setField] = React.useState(null);
    React.useEffect(()=>{
        if (search.has('field') && search.get('field') === name && field) {
            field.focus();
            field.scrollIntoView({
                block: 'center'
            });
        }
    }, [
        search,
        name,
        field
    ]);
    return setField;
};

exports.useFocusInputField = useFocusInputField;
//# sourceMappingURL=useFocusInputField.js.map
