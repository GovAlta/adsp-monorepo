export function renamePrefixProperties(value: unknown, prefix: string, replace: string): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    value = Object.getOwnPropertyNames(value).reduce((copy, property) => {
      let copyProperty = property;
      if (property.startsWith(prefix)) {
        copyProperty = `${replace}${property.substring(prefix.length)}`;
      }
      copy[copyProperty] = renamePrefixProperties(value[property], prefix, replace);
      return copy;
    }, {});
  }

  if (value && Array.isArray(value)) {
    value?.forEach((e, index) => {
      value[index] = renamePrefixProperties(value[index], prefix, replace);
    });
  }

  return value;
}
