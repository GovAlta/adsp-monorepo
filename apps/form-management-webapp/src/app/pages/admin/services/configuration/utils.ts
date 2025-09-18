export const sortConfigDefinitions = (obj: Record<string, string[]>) => {
  // convert object into array of arrays and then sort them by namespaces
  const sortedNamespaces: [string, string[]][] = Object.entries(obj).sort((template1, template2) => {
    return template1[0].localeCompare(template2[0]);
  });

  // sort names under each namespace
  for (const namespace of sortedNamespaces) {
    namespace[1].sort((a, b) => a.localeCompare(b));
  }

  // convert arrays of arrays into objects again
  const sortedNamespacesAndNames: Record<string, string[]> = sortedNamespaces.reduce((tempObj, [namespace, names]) => {
    tempObj[namespace] = names;
    return tempObj;
  }, {});

  return sortedNamespacesAndNames;
};
