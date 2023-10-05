export const upperCaseFirstLetterInClassificationType = (text: string) => {
  if (text.includes(' ')) {
    const splittedText = text.split(' ');
    const firstWord =
      splittedText.length > 0 ? splittedText[0].at(0).toLocaleUpperCase() + splittedText[0].slice(1) : '';

    const finalText = `${firstWord} ${splittedText[1].toUpperCase()}`;
    return finalText;
  }
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
};
