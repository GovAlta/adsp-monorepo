/**
 * Sets the first word to be capitalized so that it is sentence cased.
 * @param words
 * @returns sentence word string.
 */
export const capitalizeFirstLetter = (words: string) => {
  const value = words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
  return value;
};

/**
 * Compares the scope name and the label to determine if it matches so that it can be sentence case.
 * @param scope - format eg: '#/properties/firstName'
 * @param label - The label text
 * @returns true if the scope and label matches, otherwise false
 */
export const controlScopeMatchesLabel = (scope: string, label: string) => {
  // Get the property name in the string from the scope
  const splitIdName = scope.replace(' ', '').split('/')?.at(-1)?.toLowerCase() ?? '';
  const labelWithNoSpaces = label.replace(' ', '').toLowerCase();
  if (splitIdName === labelWithNoSpaces) {
    return true;
  }
  return false;
};
