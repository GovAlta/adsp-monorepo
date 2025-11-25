/**
 * Sets all the none object values of an object to the given one
 * It preserves the shape of the object, it only modifies the leafs
 * of an object.
 * This utility is very helpful when dealing with parent<>children checkboxes
 */
declare const updateValues: (obj: object, valueToSet: boolean, isFieldUpdate?: boolean) => object;
export { updateValues };
