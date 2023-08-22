export const diffMinutes = function diffMinutes(oldest, mostRecent) {
  const d1 = new Date(oldest).getTime();
  const d2 = new Date(mostRecent).getTime();
  return Math.round((d2 - d1) / 60000);
};
