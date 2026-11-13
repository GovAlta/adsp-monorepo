const MAX_LENGTH = 200;
const MAX_EXTENSION_LENGTH = 20;
const FORBIDDEN_CHARACTERS = new Set(['"', '*', ':', '<', '>', '?', '/', '\\', '|']);
const RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

const replaceForbidden = (value: string): string =>
  Array.from(value, (character) =>
    character.charCodeAt(0) < 32 || FORBIDDEN_CHARACTERS.has(character) ? '_' : character,
  ).join('');

const isTrimmed = (character: string): boolean => character === '.' || character.trim() === '';

function trimEdges(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && isTrimmed(value[start])) {
    start++;
  }
  while (end > start && isTrimmed(value[end - 1])) {
    end--;
  }
  return value.slice(start, end);
}

export function sanitizePathSegment(name: string, fallback: string): string {
  let result = trimEdges(replaceForbidden(String(name ?? '')));

  if (result.length > MAX_LENGTH) {
    const dot = result.lastIndexOf('.');
    const extension = dot > 0 && result.length - dot <= MAX_EXTENSION_LENGTH ? result.slice(dot) : '';
    result = result.slice(0, MAX_LENGTH - extension.length) + extension;
  }

  if (!result) {
    return fallback;
  }
  if (RESERVED_NAMES.test(result) || result.startsWith('~$') || result.toLowerCase() === '_vti_') {
    return `_${result}`;
  }
  return result;
}
