export function deepFreeze<T extends object>(value: T): Readonly<T> {
  Object.values(value).forEach((child) => {
    if (child !== null && typeof child === 'object') {
      deepFreeze(child);
    }
  });
  return Object.freeze(value);
}
