declare const getStageColorByHex: (hex?: string) => {
    themeColorName: string;
    name: string;
} | null;
declare const AVAILABLE_COLORS: {
    hex: string;
    name: string;
}[];
export { AVAILABLE_COLORS, getStageColorByHex };
