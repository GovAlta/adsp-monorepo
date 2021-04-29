export type Doc<E = Record<string, unknown>> = Pick<E, Exclude<keyof E, 'id'>> & { _id?: string };

export type New<E = Record<string, unknown>, U = ''> = Pick<E, Exclude<keyof E, 'id' | U>>;

export type Update<E = Record<string, unknown>, U = ''> = Partial<Pick<E, Exclude<keyof E, 'id' | U>>>;
