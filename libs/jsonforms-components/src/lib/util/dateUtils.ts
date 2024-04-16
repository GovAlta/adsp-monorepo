export const standardizeDate = (date: Date | string): string | undefined => {
  try {
    const stdDate = new Date(date).toISOString().substring(0, 10);
    return stdDate;
  } catch (e) {
    return undefined;
  }
};
