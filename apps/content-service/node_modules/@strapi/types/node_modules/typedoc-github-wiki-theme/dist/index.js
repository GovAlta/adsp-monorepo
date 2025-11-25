"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = void 0;
const theme_1 = require("./theme");
const options_reader_1 = require("./options-reader");
function load(app) {
    app.renderer.defineTheme('github-wiki', theme_1.GithubWikiTheme);
    app.options.addReader(new options_reader_1.GithubWikiThemeOptionsReader());
}
exports.load = load;
