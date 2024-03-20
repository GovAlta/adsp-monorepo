export const parseSchema = (schema: string) => {
  try {
    return JSON.parse(schema);
  } catch (e) {
    const err = e as Error;
    console.debug(err.message);
    return {};
  }
};
