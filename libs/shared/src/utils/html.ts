export const hasProperHtmlWrapper = (content: string): boolean => {
  return content.startsWith('<!doctype html>') || content.startsWith('<html>');
};
