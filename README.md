# import-alias

Import by alias and forget about maintaining relative paths.

**import-alias** allows you to add nicknames to files that you can use in import
statements.  This means you can forget about figuring out long relative
directories and, even better, you can rearrange files and have the import
statements rewritten automatically.

![import-alias](https://cloud.githubusercontent.com/assets/1720010/17175731/cd654a3c-53ce-11e6-87ce-89671b40a95d.gif)

## Installation

TODO: publish npm module
```sh
npm i -g import-alias
```

Until the npm package is published, install the source and link.
```sh
git clone git@github.com:classflow/import-alias.git
cd import-alias
npm i
npm link
```

## Usage

### Defining

Define unique aliases by adding `@alias` comments to files.

```js
// @alias Widget
```

```js
// @alias forms/Slim
```

```js
// @alias services/ajax
```

### Importing

Import aliased files with `@{alias}`.

```js
import Widget from '@Widget';
import Slim from '@forms/Slim';
import * as ajax from '@services/ajax';
```

### Transforming

Transform the import statements at any time by running `import-alias` in the
root directory.  The alias will be replaced with a relative path and a marker
appended to the line for future transformations.

```sh
import-alias
```

```js
import Widget from './shared/components/Widget'; // @Widget
import Slim from './shared/components/forms/Slim'; // @forms/Slim
import * as ajax from '../services/transport/ajax'; // @services/ajax
```

## Notes
The current version finds all js, jsx, and es6 files recursively and ignores the
directories node_modules, .git, and lib.  These options will be made
configurable in a future version.  View the [change log][changelog] for
details.

---
kickstarted by [npm-boom][npm-boom]

[npm-boom]: https://github.com/reergymerej/npm-boom
[changelog]: CHANGELOG.md
