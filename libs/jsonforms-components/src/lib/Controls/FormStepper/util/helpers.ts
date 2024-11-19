export const getProperty: any = (obj: any, propName: string) => {
  if (obj[propName] !== undefined) return obj[propName];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const result = getProperty(obj[key], propName);
      if (result !== undefined) return result;
    }
  }
};
