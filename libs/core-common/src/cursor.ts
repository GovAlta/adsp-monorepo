export const decodeAfter = (after: string) => {
  let skip = 0;
  if (after) {
    const cursorBuffer = Buffer.from(after, 'base64');
    skip = parseInt(cursorBuffer.toString('ascii'), 10);
  }

  return skip;
};

export const encodeNext = (count: number, top: number, skip: number) => {
  let next: string;
  if (count === top) {
    next = Buffer.from(`${skip + top}`).toString('base64');
  }

  return next;
};
