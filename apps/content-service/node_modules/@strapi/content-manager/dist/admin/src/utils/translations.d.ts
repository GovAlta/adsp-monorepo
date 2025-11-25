type TradOptions = Record<string, string>;
declare const prefixPluginTranslations: (trad: TradOptions, pluginId: string) => TradOptions;
declare const getTranslation: (id: string) => string;
export { getTranslation, prefixPluginTranslations };
