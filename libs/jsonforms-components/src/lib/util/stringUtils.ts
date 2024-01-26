export const capitalizeFirstLetter = (words: string) => {
  const value = words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
  return value;
};
