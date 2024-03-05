export const parseSchema = (schema: string) => {
  try {
    return JSON.parse(schema);
  } catch (e) {
    return {};
  }
};
