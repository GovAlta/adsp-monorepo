export const resolveLabelFromScope = (scope: string) => {
  // eslint-disable-next-line no-useless-escape
  const validPatternRegex = /^#(\/properties\/[^\/]+)+$/;
  const isValid = validPatternRegex.test(scope);
  if (!isValid) return null;

  const lastSegment = scope.split('/').pop();

  if (lastSegment) {
    const lowercased = lastSegment.replace(/([A-Z])/g, ' $1').toLowerCase();
    return lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  }
  return '';
};

export const getFormFieldValue = (scope: string, data: object) => {
  if (data !== undefined) {
    const pathArray = scope.replace('#/properties/', '').replace('properties/', '').split('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentValue: any = data;
    for (const key of pathArray) {
      if (currentValue[key] === undefined) {
        return '';
      }
      currentValue = currentValue[key];
    }
    return Array.isArray(currentValue)
      ? currentValue[currentValue.length - 1]
      : typeof currentValue === 'object'
      ? ''
      : currentValue;
  } else {
    return '';
  }
};
