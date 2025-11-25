import { Ref } from 'react';
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
 */
declare const useFocusInputField: <T extends HTMLElement>(name: string) => Ref<T>;
export { useFocusInputField };
