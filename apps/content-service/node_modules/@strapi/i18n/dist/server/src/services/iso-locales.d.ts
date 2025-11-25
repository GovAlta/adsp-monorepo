declare const isoLocalesService: () => {
    getIsoLocales: () => {
        code: string;
        name: string;
    }[];
};
type ISOLocalesService = typeof isoLocalesService;
export default isoLocalesService;
export type { ISOLocalesService };
//# sourceMappingURL=iso-locales.d.ts.map