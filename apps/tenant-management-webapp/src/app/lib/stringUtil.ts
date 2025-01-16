export const truncateString = (input: string, maxLength: number = 24): string => {
  return input?.length > maxLength ? input?.slice(0, maxLength) : input;
};
