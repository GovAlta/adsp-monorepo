import { Options, OptionsReader } from 'typedoc';
export declare class GithubWikiThemeOptionsReader implements OptionsReader {
    name: string;
    readonly order = 900;
    readonly supportsPackages = false;
    read(container: Options): void;
}
