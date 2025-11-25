<!-- dprint-ignore-file -->
<!-- deno-fmt-ignore-start -->

<!-- @prettier -->
<!DOCTYPE markdown><!-- markdownlint-disable first-line-heading no-inline-html -->
<meta charset="utf-8" content="text/markdown" lang="en">
<!-- -## editors ## (emacs/sublime) -*- coding: utf8-nix; tab-width: 4; mode: markdown; indent-tabs-mode: nil; basic-offset: 2; st-word_wrap: 'true' -*- ## (jEdit) :tabSize=4:indentSize=4:mode=markdown: ## (notepad++) vim:tabstop=4:syntax=markdown:expandtab:smarttab:softtabstop=2 ## modeline (see <https://archive.is/djTUD>@@<http://webcitation.org/66W3EhCAP> ) -->
<!-- spell-checker:ignore expandtab markdownlint modeline smarttab softtabstop -->

<!-- markdownlint-disable heading-increment no-duplicate-heading -->
<!-- spell-checker:ignore (abbrev/names) ArchLinux CICD Codacy Deno DPrint JSDelivr NodeJS npmJS uutils -->
<!-- spell-checker:ignore (jargon) readonly subdir tmpdir -->
<!-- spell-checker:ignore (platform/windows) APPDATA LOCALAPPDATA -->
<!-- spell-checker:ignore (targets) realclean -->
<!-- spell-checker:ignore (people) Roy Ivy III * rivy ; Sindre Sorhus * sindresorhus -->

# [xdg-portable](https://github.com/rivy/js.xdg-portable)

> Determine [XDG Base Directory](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html) paths (OS/platform portable)

[![Build status (GHA)][gha-image]][gha-url]
[![Build status (AppVeyor)][appveyor-image]][appveyor-url]
[![Coverage status][coverage-image]][coverage-url]
[![License][license-image]][license-url]
[![Style Guide][style-image]][style-url]
&nbsp; <br/>
[![Repository][repository-image]][repository-url]
[![Deno version][deno-image]][deno-url]
[![NPM version][npm-image]][npm-url]
[![NodeJS version][nodejsv-image]][repository-url]
[![npmJS Downloads][downloads-image]][downloads-url]
[![JSDelivr Downloads][jsdelivr-image]][jsdelivr-url]

<!--
XDG references
# ref: <https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html> @@ <https://archive.is/aAhtw>
# ref: <https://specifications.freedesktop.org/basedir-spec/latest/ar01s03.html> @@ <https://archive.is/7N0TN>
# ref: <https://wiki.archlinux.org/index.php/XDG_Base_Directory> @@ <https://archive.is/VdO9n>
# ref: <https://wiki.debian.org/XDGBaseDirectorySpecification#state> @@ <http://archive.is/pahId>
# ref: <https://ploum.net/207-modify-your-application-to-use-xdg-folders> @@ <https://archive.is/f43Gk>
-->

## Installation (CJS/ESM/TypeScript)

<!-- ref: [JSDelivr ~ GitHub](https://www.jsdelivr.com/documentation#id-github) @@ <https://archive.is/c8s9Y> -->

```shell
npm install xdg-portable
# or... `npm install "git:github.com/rivy/js.xdg-portable"`
# or... `npm install "git:github.com/rivy/js.xdg-portable#v10.6.0"`
# or... `npm install "https://cdn.jsdelivr.net/gh/rivy/js.xdg-portable@v10.6.0/dist/xdg-portable.tgz"`
# or... `npm install "https://cdn.jsdelivr.net/gh/rivy/js.xdg-portable@COMMIT_SHA/dist/xdg-portable.tgz"`
```

## Usage

#### CommonJS (CJS)

```js
const xdg = require('xdg-portable/cjs');

const configDirs = xdg.configDirs();
const stateDir = xdg.state();

const locatePath = require('locatePath');
const mkdirp = require('mkdirp');

const configDir = locatePath.sync(configDirs) || configDirs[0];
mkdirp.sync(configDir, 0o700);

mkdirp.sync(stateDir, 0o700);
```

#### ECMAScript (ESM)/TypeScript

```js
import xdg from 'xdg-portable';
const configDirs = xdg.configDirs();
//...
```

#### Deno

<!-- ref: [JSDelivr ~ GitHub](https://www.jsdelivr.com/documentation#id-github) @@ <https://archive.is/c8s9Y> -->

```ts
import xdg from 'https://deno.land/x/xdg_portable@v10.6.0/src/mod.deno.ts';
//or (via CDN, [ie, JSDelivr with GitHub version/version-range, commit, 'latest' support])...
//import xdg from 'https://cdn.jsdelivr.net/gh/rivy/js.xdg-portable@v10.6.0/src/mod.deno.ts';
//import xdg from 'https://cdn.jsdelivr.net/gh/rivy/js.xdg-portable@COMMIT_SHA/src/mod.deno.ts';
const configDirs = xdg.configDirs();
//...
```

## API

### Construction/Initialization

#### `XDG()`

```js
const xdg = require('xdg-portable/cjs'); // CJS
//or...
//import xdg from 'xdg-portable'; // ESM/TypeScript
//import xdg from 'https://deno.land/x/xdg/src/mod.deno.ts'; // Deno
```

When importing this module, the object returned is a function object, `XDG`, augmented with attached methods. Additional `XDG` objects may be constructed by direct call of the imported `XDG` object (eg, `const x = xdg()`) or by using `new` (eg, `const x = new xdg()`). Notably, since the `XDG` object contains no user-facing instance state, all `XDG` objects will be functionally identical.

### Types

- `XDG` ~ primary module function object

Types named here are exported individually by name (eg, as "XDG").

```js
import type { XDG } from 'xdg-portable'; // TypeScript
//or...
//import type { XDG } from 'https://deno.land/x/xdg/src/mod.deno.ts'; // Deno
```

### Methods

All module methods return platform-compatible path strings which are normalized and have no trailing path separators.

The returned path strings are _not_ guaranteed to already exist on the file system. So, the user application is responsible for directory construction, if/when needed. If needed, [`make-dir`](https://www.npmjs.com/package/make-dir) or [`mkdirp`](https://www.npmjs.com/package/mkdirp) can be used to create the directories.

#### `xdg.cache(): string`

- Returns the directory path for user-specific non-essential (ie, cached) data files.

> Deletion of the data contained here might cause an application to slow down.

```js
const cacheDir = xdg.cache();
//(mac)=> '/Users/rivy/Library/Caches'
//(nix)=> '/home/rivy/.cache'
//(win)=> 'C:\\Users\\rivy\\AppData\\Local\\xdg.cache'
```

This directory location would be analogous to _/var/cache_ for \*nix.

`%LocalAppData%\xdg.cache` is the default for the windows platform.

#### `xdg.config(): string`

- Returns the directory path for user-specific configuration files.

> Deletion of the data contained here might require the user to reconfigure an application.

```js
const configDir = xdg.config();
//(mac)=> '/Users/rivy/Library/Preferences'
//(nix)=> '/home/rivy/.config'
//(win)=> 'C:\\Users\\rivy\\AppData\\Roaming\\xdg.config'
```

This directory location would be analogous to _/etc_ for \*nix.

`%AppData%\xdg.config` is the default for the windows platform.

#### `xdg.data(): string`

- Returns directory path for user-specific data files.

> Deletion of the data contained here might force the user to restore from backups.

```js
const dataDir = xdg.data();
//(mac)=> '/Users/rivy/Library/Application Support'
//(nix)=> '/home/rivy/.local/share'
//(win)=> 'C:\\Users\\rivy\\AppData\\Roaming\\xdg.data'
```

This directory location would be analogous to _/usr/share_ for \*nix.

`%AppData%\xdg.data` is the default for the windows platform.

#### `xdg.runtime(): string?`

- Returns the directory path for user-specific non-essential runtime files (such as sockets, named pipes, etc); may be `undefined`.

> Deletion of the data contained here might interfere with a currently executing application but should have no effect on future executions.

```js
const runtimeDir = xdg.runtime();
```

The XDG specification defines some fairly strict specifications for a "runtime"-data candidate directory. To meet these criteria, the directory must usually be supplied by the OS. The user may override this by using the `XDG_RUNTIME_DIR` environment variable.

`undefined` is the default for the windows platform.

- ref: [archlinux ~ XDG Base Directory](https://wiki.archlinux.org/index.php/XDG_Base_Directory#User_directories)<small><sup>&shy;[`@`](https://archive.is/VdO9n#3.9%)</sup></small>

#### `xdg.state(): string`

- Returns the directory path for user-specific state files (non-essential and more volatile than configuration files).

> Deletion of the data contained here should not materially interfere with execution of an application.

```js
const stateDir = xdg.state();
//(mac)=> '/Users/rivy/Library/State'
//(nix)=> '/home/rivy/.local/state'
//(win)=> 'C:\\Users\\rivy\\AppData\\Local\\xdg.state'
```

This directory location might hold data such as backups, input history, logs, recent file lists, visual application state, etc.

`%LocalAppData%\xdg.state` is the default for the windows platform.

#### `xdg.configDirs(): readonly string[]`

- Returns a preference-ordered array of base directory paths to search for configuration files (includes `xdg.config()` directory as first entry).

```js
const configDirs = xdg.configDirs();
//(mac)=> [ '/Users/rivy/Library/Preferences', ... ]
//(nix)=> [ '/home/rivy/.config', ... ]
//(win)=> [ 'C:\\Users\\rivy\\AppData\\Roaming\\xdg.config' , ... ]
```

#### `xdg.dataDirs(): readonly string[]`

- Returns a preference-ordered array of base directory paths to search for data files (includes `xdg.data()` directory as first entry).

```js
const dataDirs = xdg.dataDirs();
//(mac)=> [ '/Users/rivy/Library/Application Support', ... ]
//(nix)=> [ '/home/rivy/.local/share', ... ]
//(win)=> [ 'C:\\Users\\rivy\\AppData\\Roaming\\xdg.share' , ... ]
```

## Supported Platforms

### NodeJS

> #### Requirements
>
> NodeJS >= 4.0[^*]

<!--{blockquote: .--info style="font-size:75%;"}-->

[^*]: With the conversion to a TypeScript-based project, due to tooling constraints, building and testing are more difficult and more limited on Node platforms earlier than NodeJS-v10. However, the generated CommonJS/UMD project code is fully tested (for NodeJS-v10+) and continues to be compatible with NodeJS-v4+.

#### CommonJS modules (CJS; `*.js` and `*.cjs`)

CJS is the basic supported output (with support for NodeJS versions as early as NodeJS-v4).

```js
const xdg = require('xdg-portable/cjs');
console.log(xdg.config());
```

> Note: for CJS, `require('xdg-portable')` is supported for backward-compatibility and will execute correctly at run-time. However, `require('xdg-portable')` links to the default package type declarations which, though _correct_ for Deno/ESM/TypeScript, are _incorrect_ for CJS. This, then, leads to incorrect analysis of CJS files by static analysis tools such as TypeScript and Intellisense.
>
> Using `require('xdg-portable/cjs')` is preferred as it associates the proper CJS type declarations and provides correct information to static analysis tools.

#### ECMAScript modules (ESM; `*.mjs`)

- <small><span title="ESM support added in v8.0">Requires `XDG` `v8.0`+.</span></small>

`XDG` fully supports ESM imports.

```js
import xdg from 'xdg-portable';
console.log(xdg.config());
```

### TypeScript (`*.ts`)

- <small><span title="TypeScript support added in v8.0">Requires `XDG` `v8.0`+.</span></small>

As of `v8.0`+, `XDG` has been converted to a TypeScript-based module.
As a consequence, TypeScript type definitions are automatically generated, bundled, and exported by the module.

### Deno

> #### Requirements
>
> Deno >= v1.8.0[^deno-version-req]

<!--{blockquote: .--info style="font-size:75%;"}-->

[^deno-version-req]: The `Deno.permissions` API (stabilized in Deno v1.8.0) is required to avoid needless panics or prompts by Deno during static imports of this module/package. Note: Deno v1.3.0+ may be used if the run flag `--unstable` is also used.

> #### Required Permissions
>
> - `--allow-env` &middot; _allow access to the process environment variables_<br>
>   This module/package requires access to various environment variables to determine platform configuration (eg, location of temp and user directories).

<!--{blockquote: .--info style="font-size:75%;"}-->

- <small><span title="Deno support added in v9.0">Requires `XDG` `v9.0`+.</span></small>

`XDG` also fully supports use by Deno.

```js deno
import xdg from 'https://deno.land/x/xdg/src/mod.deno.ts';
console.log(xdg.config());
```

## Discussion

The [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html)<small><sup>&shy;[@](https://archive.is/J0mTC)</sup></small> defines categories of user information (ie, "cache", "config", "data", ...), defines their standard storage locations, and defines the standard process for user configuration of those locations (using `XDG_CACHE_HOME`, etc).

Applications supporting the XDG convention are expected to store user-specific files within these locations, either within the common/shared directory (eg, `` `${xdg.cache()}/filename` ``) or within a more isolated application-defined subdirectory (eg, `` `${xdg.config()}/DIR/filename` ``; `DIR` usually being the application name).

### Windows ("win32") specific notes

Windows has an alternate convention, offering just two standard locations for applications to persist data, either `%APPDATA%` (for files which may "roam" with the user between hosts) and `%LOCALAPPDATA%` (for local-machine-only files). All application files are expected to be stored within an application-unique subdirectory in one of those two locations, usually under a directory matching the application name. There is no further popular convention used to segregate the file types (ie, into "cache", "config", ...) in any way similar to the XDG specification.

So, to support basic XDG-like behavior (that is, segregating the information types into type-specific directories), this module creates a new convention for Windows hosts, placing the specific types of files into subdirectories under either `%APPDATA%` or `%LOCALAPPDATA%`, as appropriate for the file type. For example, "cache"-type files will be offered placement into `%LOCALAPPDATA%\xdg.cache`, "config"-type files into `%APPDATA%\xdg.config`, "data"-type files into `%APPDATA%\xdg.data`, etc.

[`xdg-app-paths`](https://www.npmjs.com/package/xdg-app-paths) builds on this module and offers application specific paths more in-line with usual platform conventions, but still compatible with the XDG specification.

### Fallback to temporary directory

In the uncommon case that both the XDG environment variable is not set and the users home directory can't be determined, the temporary directory (OS/platform specific; determined by `temp()` from [os-paths](https://www.npmjs.com/package/os-paths)) will be used as a fallback for the missing home directory value.

### Origins

This module was forked from [sindresorhus/xdg-basedir](https://github.com/sindresorhus/xdg-basedir) in order to add cross-platform portability and support simpler cross-platform applications.

- ref: <https://github.com/sindresorhus/xdg-basedir/pull/4>

## Building and Contributing

[![Repository][repository-image]][repository-url]
[![Build status (GHA)][gha-image]][gha-url]
[![Build status (AppVeyor)][appveyor-image]][appveyor-url]
[![Coverage status][coverage-image]][coverage-url]
&nbsp; <br/>
[![Quality status (Codacy)][codacy-image]][codacy-url]
[![Quality status (CodeClimate)][codeclimate-image]][codeclimate-url]
[![Quality status (CodeFactor)][codefactor-image]][codefactor-url]

### Build requirements

- NodeJS >= 10.14
- a JavaScript package/project manager ([`npm`](https://www.npmjs.com/get-npm) or [`yarn`](https://yarnpkg.com))
- [`git`](https://git-scm.com)

> #### optional
>
> - [`bmp`](https://deno.land/x/bmp@v0.0.6) (v0.0.6+) ... synchronizes version strings within the project
> - [`git-changelog`](https://github.com/rivy-go/git-changelog) (v1.1+) ... enables changelog automation

### Quick build/test

```shell
npm install-test
```

### Contributions/development

#### _Reproducible_ setup (for CI or local development)

```shell
git clone "https://github.com/rivy/js.xdg-portable"
cd js.xdg-portable
# * note: for WinOS, replace `cp` with `copy` (or use [uutils](https://github.com/uutils/coreutils))
# npm
cp .deps-lock/package-lock.json .
npm clean-install
# yarn
cp .deps-lock/yarn.lock .
yarn --immutable --immutable-cache --check-cache
```

#### Project development scripts

```shell
> npm run help
...
usage: `npm run TARGET` or `npx run-s TARGET [TARGET..]`

TARGETs:

build               build/compile package
clean               remove build artifacts
coverage            calculate and display (or send) code coverage [alias: 'cov']
fix                 fix package issues (automated/non-interactive)
fix:lint            fix ESLint issues
fix:style           fix Prettier formatting issues
help                display help
lint                check for package code 'lint'
lint:audit          check for `npm audit` violations in project code
lint:commits        check for commit flaws (using `commitlint` and `cspell`)
lint:editorconfig   check for EditorConfig format flaws (using `editorconfig-checker`)
lint:lint           check for code 'lint' (using `eslint`)
lint:markdown       check for markdown errors (using `remark`)
lint:spell          check for spelling errors (using `cspell`)
lint:style          check for format imperfections (using `prettier`)
prerelease          clean, rebuild, and fully test (useful prior to publish/release)
realclean           remove all generated files
rebuild             clean and (re-)build project
refresh             clean and rebuild/regenerate all project artifacts
refresh:dist        clean, rebuild, and regenerate project distribution
retest              clean and (re-)test project
reset:hard          remove *all* generated files and reinstall dependencies
show:deps           show package dependencies
test                test package
test:code           test package code (use `--test-code=...` to pass options to testing harness)
test:types          test for type declaration errors (using `tsd`)
update              update/prepare for distribution [alias: 'dist']
update:changelog    update CHANGELOG (using `git changelog ...`)
update:dist         update distribution content
verify              fully (and verbosely) test package
```

#### Packaging & Publishing

##### Package

```shell
#=== * POSIX
# update project VERSION strings (package.json,...)
# * `bmp --[major|minor|patch]`; next VERSION in M.m.r (semver) format
bmp --minor
VERSION=$(cat VERSION)
git-changelog --next-tag "v${VERSION}" > CHANGELOG.mkd
# create/commit updates and distribution
git add package.json CHANGELOG.mkd README.md VERSION .bmp.yml
git commit -m "${VERSION}"
npm run clean && npm run update:dist && git add dist && git commit --amend --no-edit
# (optional) update/save dependency locks
# * note: `yarn import` of 'package-lock.json' (when available) is faster but may not work for later versions of 'package-lock.json'
rm -f package-lock.json yarn.lock
npm install --package-lock
yarn install
mkdir .deps-lock 2> /dev/null
cp package-lock.json .deps-lock/
cp yarn.lock .deps-lock/
git add .deps-lock
git commit --amend --no-edit
# tag VERSION commit
git tag -f "v${VERSION}"
# (optional) prerelease checkup
npm run prerelease
#=== * WinOS
@rem # update project VERSION strings (package.json,...)
@rem # * `bmp --[major|minor|patch]`; next VERSION in M.m.r (semver) format
bmp --minor
for /f %G in (VERSION) do @set "VERSION=%G"
git-changelog --next-tag "v%VERSION%" > CHANGELOG.mkd
@rem # create/commit updates and distribution
git add package.json CHANGELOG.mkd README.md VERSION .bmp.yml
git commit -m "%VERSION%"
npm run clean && npm run update:dist && git add dist && git commit --amend --no-edit
@rem # (optional) update/save dependency locks
@rem # * note: `yarn import` of 'package-lock.json' (when available) is faster but may not work for later versions of 'package-lock.json'
del package-lock.json yarn.lock 2>NUL
npm install --package-lock
yarn install
mkdir .deps-lock 2>NUL
copy /y package-lock.json .deps-lock >NUL
copy /y yarn.lock .deps-lock >NUL
git add .deps-lock
git commit --amend --no-edit
@rem # tag VERSION commit
git tag -f "v%VERSION%"
@rem # (optional) prerelease checkup
npm run prerelease
```

##### Publish

```shell
# publish
# * optional (will be done in 'prePublishOnly' by `npm publish`)
npm run clean && npm run test && npm run dist && git-changelog > CHANGELOG.mkd #expect exit code == 0
git diff-index --quiet HEAD || echo "[lint] ERROR uncommitted changes" # expect no output and exit code == 0
# *
npm publish # `npm publish --dry-run` will perform all prepublication actions and stop just before the actual publish push
# * if published to NPMjs with no ERRORs; push to deno.land with tag push
git push origin --tags
```

### Contributions

Contributions are welcome.

Any pull requests should be based off of the default branch (`master`). And, whenever possible, please include tests for any new code, ensuring that local (via `npm test`) and remote CI testing passes.

By contributing to the project, you are agreeing to provide your contributions under the same [license](./LICENSE) as the project itself.

## Related

- [`os-paths`](https://www.npmjs.com/package/os-paths) ... portable common OS/platform paths (home, temp, ...)
- [`xdg-app-paths`](https://www.npmjs.com/package/xdg-app-paths) ... easy XDG for applications
- [`xdg-basedir`](https://www.npmjs.com/package/xdg-basedir) ... inspiration for this module

## License

[MIT](./LICENSE) © [Roy Ivy III](https://github.com/rivy)

<!-- badge references -->

<!-- Repository -->
<!-- Note: for '[repository-image] ...', `%E2%81%A3` == utf-8 sequence of "Unicode Character 'INVISIBLE SEPARATOR' (U+2063)"; ref: <https://codepoints.net/U+2063> -->

[repository-image]: https://img.shields.io/github/v/tag/rivy/js.xdg-portable?sort=semver&label=%E2%81%A3&logo=github&logoColor=white
[repository-url]: https://github.com/rivy/js.xdg-portable
[license-image]: https://img.shields.io/npm/l/xdg-portable.svg?color=tomato&style=flat
[license-url]: license
[nodejsv-image]: https://img.shields.io/node/v/xdg-portable?color=slateblue
[style-image]: https://img.shields.io/badge/code_style-prettier-mediumvioletred.svg
[style-url]: https://prettier.io

<!-- Continuous integration/deployment (CICD) -->

[appveyor-image]: https://img.shields.io/appveyor/ci/rivy/js-xdg-portable/master.svg?style=flat&logo=AppVeyor&logoColor=deepskyblue
[appveyor-url]: https://ci.appveyor.com/project/rivy/js-xdg-portable
[gha-image]: https://img.shields.io/github/actions/workflow/status/rivy/js.xdg-portable/CI.yml?branch=master&label=CI&logo=github
[gha-url]: https://github.com/rivy/js.xdg-portable/actions?query=workflow%3ACI

<!-- Code quality -->

[coverage-image]: https://img.shields.io/codecov/c/github/rivy/js.xdg-portable/master.svg
[coverage-url]: https://codecov.io/gh/rivy/js.xdg-portable
[codeclimate-url]: https://codeclimate.com/github/rivy/js.xdg-portable
[codeclimate-image]: https://img.shields.io/codeclimate/maintainability/rivy/js.xdg-portable?label=codeclimate
[codacy-image]: https://img.shields.io/codacy/grade/06ce379ca8cb437db6c79f6eeca7f2f9?label=codacy
[codacy-url]: https://app.codacy.com/gh/rivy/js.xdg-portable/dashboard
[codefactor-image]: https://img.shields.io/codefactor/grade/github/rivy/js.xdg-portable?label=codefactor
[codefactor-url]: https://www.codefactor.io/repository/github/rivy/js.xdg-portable

<!-- Distributors/Registries -->

[deno-image]: https://img.shields.io/github/package-json/v/rivy/js.xdg-portable/master?label=deno
[deno-url]: https://deno.land/x/xdg
[downloads-image]: http://img.shields.io/npm/dm/xdg-portable.svg?style=flat
[downloads-url]: https://npmjs.org/package/xdg-portable
[jsdelivr-image]: https://img.shields.io/jsdelivr/gh/hm/rivy/js.xdg-portable?style=flat
[jsdelivr-url]: https://www.jsdelivr.com/package/gh/rivy/js.xdg-portable
[npm-image]: https://img.shields.io/npm/v/xdg-portable.svg?style=flat
[npm-url]: https://npmjs.org/package/xdg-portable

<!-- Alternate/Old image/URL links -->

<!-- [appveyor-image]: https://ci.appveyor.com/api/projects/status/.../branch/master?svg=true -->
<!-- [coverage-image]: https://img.shields.io/coveralls/github/rivy/xdg-portable/master.svg -->
<!-- [coverage-url]: https://coveralls.io/github/rivy/xdg-portable -->
<!-- [npm-image]: https://img.shields.io/npm/v/xdg-portable.svg?style=flat&label=npm&logo=NPM&logoColor=linen -->
<!-- [repository-image]:https://img.shields.io/badge/%E2%9D%A4-darkcyan?style=flat&logo=github -->
<!-- [style-image]: https://img.shields.io/badge/code_style-standard-darkcyan.svg -->
<!-- [style-url]: https://standardjs.com -->
<!-- [travis-image]: https://img.shields.io/travis/rivy/js.xdg-portable/master.svg?style=flat&logo=Travis-CI&logoColor=silver -->
<!-- [travis-image]: https://travis-ci.org/rivy/js.xdg-portable.svg?branch=master -->
<!-- [travis-image]: https://img.shields.io/travis/rivy/js.xdg-portable/master.svg?style=flat&logo=travis -->
<!-- [travis-url]: https://travis-ci.org/rivy/js.xdg-portable -->
